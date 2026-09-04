const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../models');
const emailService = require('./emailService');
const { normalizeRoleLabel, toCanonicalRole } = require('../utils/roles');

const normalizeRole = normalizeRoleLabel;

const REQUEST_ROLE_LABELS = new Map([
    ['chef operationnel', 'Chef Opérationnel'],
    ['operationnel', 'Opérationnel'],
    ['manager', 'Manager']
]);
const REQUEST_ROLE_ORDER = ['Manager', 'Chef Opérationnel', 'Opérationnel'];

class AccountService {
    assertActorCenter(actor) {
        if (!actor || !actor.role) {
            const error = new Error('Authentification requise');
            error.statusCode = 401;
            throw error;
        }
        if (!['super_admin', 'manager'].includes(actor.role) && !actor.centerId) {
            const error = new Error('Aucun centre rattaché à ce compte');
            error.statusCode = 403;
            throw error;
        }
    }

    async assertResourceScope(actor, centreId) {
        this.assertActorCenter(actor);
        if (actor.role !== 'super_admin' && String(actor.centerId) !== String(centreId || '')) {
            const error = new Error("Cette ressource n'appartient pas à votre centre");
            error.statusCode = 403;
            throw error;
        }
    }

    async assertManageableUser(actor, user) {
        await this.assertResourceScope(actor, user.centre_id);
        const targetRole = toCanonicalRole(user.role && user.role.libelle);
        if (actor.role === 'admin' && ['admin', 'super_admin'].includes(targetRole)) {
            const error = new Error('Un administrateur de centre ne peut pas gérer un compte administrateur.');
            error.statusCode = 403;
            throw error;
        }
        if (targetRole === 'super_admin') {
            const error = new Error('Le compte Super Admin ne peut pas être géré depuis cette action.');
            error.statusCode = 403;
            throw error;
        }
    }
    async assertParentExists(model, id, label, transaction) {
        if (!id) return;
        const parent = await model.findByPk(id, { transaction });
        if (!parent) {
            const error = new Error(`${label} introuvable`);
            error.statusCode = 400;
            throw error;
        }
    }

    async validateAccountReferences(values, transaction, { requireRole = false } = {}) {
        if (requireRole && !values.role_id) {
            const error = new Error('A valid role is required to create an account');
            error.statusCode = 400;
            throw error;
        }
        await Promise.all([
            values.role_id !== undefined && values.role_id !== null
                ? this.assertParentExists(db.Role, values.role_id, 'Rôle', transaction) : null,
            values.da_id ? this.assertParentExists(db.Da, values.da_id, 'Partenaire', transaction) : null,
            values.zone_id ? this.assertParentExists(db.Zone, values.zone_id, 'Zone', transaction) : null
        ]);
    }

    // A user is an author/actor in several tables.  Do not remove the parent
    // account while a valid business or audit record still points at it: that
    // would either fail under SQLite FK enforcement or discard useful history.
    async getUserReferences(userId, transaction) {
        const tables = await db.sequelize.query(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
            { transaction, type: db.Sequelize.QueryTypes.SELECT }
        );
        const quoteIdentifier = (name) => `"${String(name).replace(/"/g, '""')}"`;
        const references = [];

        for (const { name: table } of tables) {
            if (table === 'utilisateur') continue;
            const foreignKeys = await db.sequelize.query(
                `PRAGMA foreign_key_list(${quoteIdentifier(table)})`,
                { transaction, type: db.Sequelize.QueryTypes.SELECT }
            );
            for (const foreignKey of foreignKeys.filter((key) => key.table === 'utilisateur')) {
                const rows = await db.sequelize.query(
                    `SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier(foreignKey.from)} = :userId`,
                    { replacements: { userId }, transaction, type: db.Sequelize.QueryTypes.SELECT }
                );
                const count = Number(rows[0] && rows[0].count) || 0;
                if (count) references.push({ table, column: foreignKey.from, count });
            }
        }
        return references;
    }

    async destroyUnreferencedUser(user, transaction) {
        // A manager account may be referenced by other accounts.  This optional
        // assignment is not historical data, so safely detach it before the
        // parent account is removed.
        await db.Utilisateur.update(
            { id_manager: null },
            { where: { id_manager: user.id }, transaction }
        );
        // La demande conserve déjà le nom, le matricule, l'email et le rôle.
        // On détache donc le compte supprimé sans perdre l'historique de décision.
        await db.DemandeAcces.update(
            { utilisateur_id: null },
            { where: { utilisateur_id: user.id }, transaction }
        );
        await db.DemandeAcces.update(
            { valide_par: null },
            { where: { valide_par: user.id }, transaction }
        );
        if (db.AuditLog) {
            await db.AuditLog.update(
                { utilisateur_id: null },
                { where: { utilisateur_id: user.id }, transaction }
            );
        }
        const references = await this.getUserReferences(user.id, transaction);
        if (references.length) {
            const error = new Error('Ce compte ne peut pas être supprimé car il est référencé par des données existantes. Désactivez-le pour préserver l’historique.');
            error.statusCode = 409;
            error.references = references;
            throw error;
        }
        await user.destroy({ transaction });
    }

    async listUsers(actor) {
        this.assertActorCenter(actor);
        const users = await db.Utilisateur.findAll({
            where: ['super_admin', 'manager'].includes(actor.role) ? {} : { centre_id: actor.centerId },
            attributes: { exclude: ['mot_de_passe'] },
            include: [
                { model: db.Role, as: 'role' },
                { model: db.Poste, as: 'poste', include: [{ model: db.Role, as: 'role' }], required: false },
                { model: db.Centre, as: 'centre', required: false },
                { model: db.Utilisateur, as: 'chefOperationnel', attributes: ['id', 'nom_complet', 'matricule'], required: false },
                { model: db.Da, as: 'da' },
                {
                    model: db.DemandeAcces,
                    as: 'demandesAcces',
                    attributes: ['id', 'statut', 'created_at'],
                    required: false
                }
            ],
            order: [
                ['nom_complet', 'ASC']
            ]
        });
        const visibleUsers = actor.role === 'super_admin'
            ? users
            : users.filter((user) => !['super_admin'].includes(toCanonicalRole(user.role && user.role.libelle)));

        return visibleUsers.map((user) => {
            const result = user.toJSON();
            if (!result.poste && result.role) result.poste = { libelle: result.role.libelle };
            return result;
        });
    }

    async getUser(userId) {
        return db.Utilisateur.findByPk(userId, {
            attributes: { exclude: ['mot_de_passe'] },
            include: [
                { model: db.Role, as: 'role' },
                { model: db.Centre, as: 'centre', required: false },
                { model: db.Utilisateur, as: 'chefOperationnel', attributes: ['id', 'nom_complet', 'matricule'], required: false },
                { model: db.Da, as: 'da' },
                {
                    model: db.DemandeAcces,
                    as: 'demandesAcces',
                    attributes: ['id', 'statut', 'created_at'],
                    required: false
                }
            ]
        });
    }

    async listPostes() {
        return db.Poste.findAll({
            include: [{ model: db.Role, as: 'role' }],
            order: [['libelle', 'ASC']]
        });
    }

    async listRequestRoles() {
        const roles = await db.Role.findAll({ order: [['libelle', 'ASC']] });
        const seenLabels = new Set();
        return roles
            .map((role) => {
                const label = REQUEST_ROLE_LABELS.get(normalizeRole(role.libelle));
                if (!label || seenLabels.has(label)) return null;
                seenLabels.add(label);
                return { id: role.id, libelle: label };
            })
            .filter(Boolean)
            .sort((left, right) => REQUEST_ROLE_ORDER.indexOf(left.libelle) - REQUEST_ROLE_ORDER.indexOf(right.libelle));
    }

    async listPublicChefs(centreId) {
        const normalizedCentreId = String(centreId || '').trim();
        const centre = await db.Centre.findOne({ where: { id: normalizedCentreId, active: true } });
        if (!centre) {
            const error = new Error('Centre actif introuvable.');
            error.statusCode = 404;
            throw error;
        }
        const users = await db.Utilisateur.findAll({
            where: { centre_id: normalizedCentreId, statut: 'actif' },
            attributes: ['id', 'nom_complet', 'matricule'],
            include: [{ model: db.Role, as: 'role', attributes: ['libelle'] }],
            order: [['nom_complet', 'ASC']],
        });
        return users
            .filter((user) => toCanonicalRole(user.role && user.role.libelle) === 'chef_operationnel')
            .map((user) => ({
                id: String(user.id),
                nom_complet: user.nom_complet,
                matricule: user.matricule,
            }));
    }

    async listPendingAccounts(actor) {
        this.assertActorCenter(actor);
        return db.DemandeAcces.findAll({
            where: {
                statut: 'EN_ATTENTE',
                ...(actor.role === 'super_admin' ? {} : { centre_id: actor.centerId })
            },
            include: [
                { model: db.Utilisateur, as: 'user', attributes: { exclude: ['mot_de_passe'] } },
                { model: db.Poste, as: 'poste', include: [{ model: db.Role, as: 'role' }] },
                { model: db.Role, as: 'role' },
                { model: db.Centre, as: 'centre' },
                { model: db.Utilisateur, as: 'chefOperationnel', attributes: ['id', 'nom_complet', 'matricule'], required: false }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    // Historique complet des demandes (EN_ATTENTE, APPROUVEE, REFUSEE).
    async listAllDemandes(actor) {
        this.assertActorCenter(actor);
        return db.DemandeAcces.findAll({
            where: actor.role === 'super_admin' ? {} : { centre_id: actor.centerId },
            include: [
                { model: db.Utilisateur, as: 'user', attributes: { exclude: ['mot_de_passe'] } },
                { model: db.Poste, as: 'poste', include: [{ model: db.Role, as: 'role' }] },
                { model: db.Role, as: 'role' },
                { model: db.Centre, as: 'centre' },
                { model: db.Utilisateur, as: 'chefOperationnel', attributes: ['id', 'nom_complet', 'matricule'], required: false }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    // Détermine le poste et le rôle à partir du payload de la demande.
    // Le rôle n'est JAMAIS saisi par l'utilisateur : il est toujours déduit de
    // la table `poste` (via la colonne `poste.role_id`).
    async resolveRequestedPoste(payload, transaction) {
        if (payload.poste_id) {
            const poste = await db.Poste.findByPk(payload.poste_id, { transaction });
            if (!poste) {
                const error = new Error('Poste introuvable');
                error.statusCode = 400;
                throw error;
            }
            return { posteId: poste.id, roleId: poste.role_id, libelle: poste.libelle };
        }

        const requestedName = String(payload.poste || '').trim();
        if (!requestedName) {
            const error = new Error('Le poste est obligatoire (champ poste ou poste_id).');
            error.statusCode = 400;
            throw error;
        }

        const postes = await db.Poste.findAll({ transaction });
        const normalize = (value) => String(value || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[\/_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        const poste = postes.find((item) => normalize(item.libelle) === normalize(requestedName));
        if (!poste) {
            const error = new Error(`Poste inconnu: ${requestedName}`);
            error.statusCode = 400;
            throw error;
        }
        return { posteId: poste.id, roleId: poste.role_id, libelle: poste.libelle };
    }

    // Résout et valide le rôle explicitement demandé. La compatibilité avec les
    // anciennes demandes basées sur un poste est conservée côté API.
    async resolveRequestedRole(payload, transaction) {
        if (payload.role_id !== undefined && payload.role_id !== null && String(payload.role_id).trim() !== '') {
            const role = await db.Role.findByPk(payload.role_id, { transaction });
            if (!role || !REQUEST_ROLE_LABELS.has(normalizeRole(role.libelle))) {
                const error = new Error('Rôle demandé invalide');
                error.statusCode = 400;
                throw error;
            }
            return role.id;
        }

        if (payload.poste_id || payload.poste) {
            const resolved = await this.resolveRequestedPoste(payload, transaction);
            const role = await db.Role.findByPk(resolved.roleId, { transaction });
            if (role && REQUEST_ROLE_LABELS.has(normalizeRole(role.libelle))) return role.id;
        }

        const error = new Error('Le rôle est obligatoire.');
        error.statusCode = 400;
        throw error;
    }

    async validateRequestedChef(roleId, centreId, chefId, transaction = undefined) {
        const role = await db.Role.findByPk(roleId, { transaction });
        const isOperationnel = role && toCanonicalRole(role.libelle) === 'operationnel';
        if (!isOperationnel) return null;

        const normalizedChefId = String(chefId || '').trim();
        if (!normalizedChefId || ['undefined', 'null'].includes(normalizedChefId.toLowerCase())) {
            const error = new Error('Le Chef opérationnel est obligatoire pour un compte Opérationnel.');
            error.statusCode = 400;
            throw error;
        }
        const chef = await db.Utilisateur.findByPk(normalizedChefId, {
            include: [{ model: db.Role, as: 'role' }],
            transaction,
        });
        if (!chef
            || chef.statut !== 'actif'
            || toCanonicalRole(chef.role && chef.role.libelle) !== 'chef_operationnel'
            || String(chef.centre_id || '') !== String(centreId || '')) {
            const error = new Error("Le Chef opérationnel sélectionné n'est pas actif dans ce centre.");
            error.statusCode = 400;
            throw error;
        }
        return String(chef.id);
    }

    async requestAccount(payload) {
        const email = String(payload.email || '').trim().toLowerCase();
        const nomComplet = String(payload.name || payload.nom_complet || '').trim();
        const matricule = String(payload.matricule || '').trim();
        const telephone = String(payload.telephone || '').trim();
        if (!nomComplet || !matricule || !email || !telephone) {
            const error = new Error('Nom complet, matricule, email et téléphone sont obligatoires.');
            error.statusCode = 400;
            throw error;
        }

        const existing = await db.Utilisateur.findOne({ where: { [db.Sequelize.Op.or]: [{ email }, { matricule }] } });
        if (existing) {
            throw new Error('Compte déjà existant');
        }

        const centreId = String(payload.centre_id || '').trim();
        if (!centreId || ['undefined', 'null'].includes(centreId.toLowerCase())) {
            const error = new Error('Le centre est obligatoire.');
            error.statusCode = 400;
            throw error;
        }
        const centre = await db.Centre.findOne({ where: { id: centreId, active: true } });
        if (!centre) {
            const error = new Error('Centre actif introuvable.');
            error.statusCode = 400;
            throw error;
        }

        // Le rôle provient de la table `role`. Le poste historique est facultatif
        // et n'est conservé que pour les anciens clients de l'API.
        const roleId = await this.resolveRequestedRole(payload);
        const posteId = payload.poste_id || payload.poste
            ? (await this.resolveRequestedPoste(payload)).posteId
            : null;
        if (!roleId) throw new Error('Impossible de déterminer le rôle du compte');
        const chefOperationnelId = await this.validateRequestedChef(
            roleId,
            centreId,
            payload.chef_operationnel_id
        );

        let demandeId;
        await db.sequelize.transaction(async (transaction) => {
            await this.validateAccountReferences(
                { role_id: roleId, zone_id: payload.zone_id },
                transaction,
                { requireRole: true }
            );
            const account = await db.Utilisateur.create({
                nom_complet: nomComplet,
                email,
                telephone,
                mot_de_passe: await bcrypt.hash(this.generateTemporaryPassword(), 10),
                role_id: roleId,
                centre_id: centreId,
                poste_id: posteId,
                statut: 'inactif',
                // Une création ou une approbation de compte ne vaut jamais
                // affectation métier. Seul le Chef passe ensuite par /affectations.
                da_id: null,
                zone_id: payload.zone_id || null,
                id_manager: chefOperationnelId,
                matricule
            }, { transaction });

            // La demande est enregistrée EN_ATTENTE et transmise à l'admin.
            const demande = await db.DemandeAcces.create({
                utilisateur_id: account.id,
                poste_id: posteId,
                role_id: roleId,
                centre_id: centreId,
                chef_operationnel_id: chefOperationnelId,
                nom_complet: account.nom_complet,
                matricule: account.matricule,
                email: account.email,
                telephone: account.telephone,
                statut: 'EN_ATTENTE'
            }, { transaction });
            demandeId = demande.id;
        });

        return this.getDemande(demandeId);
    }

    async getDemande(demandeId) {
        return db.DemandeAcces.findByPk(demandeId, {
            include: [
                { model: db.Utilisateur, as: 'user', attributes: { exclude: ['mot_de_passe'] } },
                { model: db.Poste, as: 'poste', include: [{ model: db.Role, as: 'role' }] },
                { model: db.Role, as: 'role' },
                { model: db.Centre, as: 'centre' },
                { model: db.Utilisateur, as: 'chefOperationnel', attributes: ['id', 'nom_complet', 'matricule'], required: false }
            ]
        });
    }

    // Recherche un utilisateur par email OU matricule.
    async findUserByIdentifiant(identifiant) {
        const value = String(identifiant || '').trim();
        if (!value) return null;
        return db.Utilisateur.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { email: value.toLowerCase() },
                    { matricule: value }
                ]
            }
        });
    }

    // Secret à usage unique, assez robuste pour être communiqué manuellement.
    generateTemporaryPassword(length = 12) {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        return Array.from(
            { length },
            () => alphabet[crypto.randomInt(0, alphabet.length)]
        ).join('');
    }

    async requestPasswordReset(identifiant) {
        const user = await this.findUserByIdentifiant(identifiant);
        const message = 'Si un compte correspond à cet identifiant, la demande a été enregistrée et un email de confirmation a été envoyé.';

        // Réponse volontairement identique lorsque le compte n'existe pas afin
        // de ne pas permettre l'énumération des adresses de la plateforme.
        if (!user) return { message };

        await db.sequelize.transaction(async (transaction) => {
            await user.update({ statut: 'reset_demande' }, { transaction });
            await this.recordAudit({
                utilisateur_id: user.id,
                action: 'reinitialisation_demandee',
                entite: 'utilisateur',
                entite_id: user.id,
                details: { email: user.email, demandee_le: new Date().toISOString() }
            }, transaction);
        });

        await emailService.sendPasswordResetRequested({
            email: user.email,
            name: user.nom_complet
        });
        return { message };
    }

    async resetUserPassword(userId, actor) {
        const user = await db.Utilisateur.findByPk(userId, { include: [{ model: db.Role, as: 'role' }] });
        if (!user) {
            const error = new Error('Compte introuvable');
            error.statusCode = 404;
            throw error;
        }
        await this.assertManageableUser(actor, user);
        if (user.statut !== 'reset_demande') {
            const error = new Error('Aucune demande de réinitialisation n’est en attente pour ce compte.');
            error.statusCode = 400;
            throw error;
        }

        const temporaryPassword = this.generateTemporaryPassword();
        await db.sequelize.transaction(async (transaction) => {
            await user.update({
                statut: 'actif',
                mot_de_passe: await bcrypt.hash(temporaryPassword, 10),
                must_change_password: true
            }, { transaction });
            await this.recordAudit({
                utilisateur_id: actor.id,
                action: 'mot_de_passe_reinitialise',
                entite: 'utilisateur',
                entite_id: user.id,
                details: {
                    email: user.email,
                    centre_id: user.centre_id,
                    auteur_role: actor.role,
                    reinitialise_le: new Date().toISOString()
                }
            }, transaction);
        });

        const emailNotification = await emailService.sendPasswordResetCompleted({
            email: user.email,
            name: user.nom_complet,
            temporaryPassword
        });
        const result = user.toJSON();
        delete result.mot_de_passe;
        return { ...result, temporaryPassword, emailNotification };
    }

    async deleteAccount(identifiant, password) {
        const user = await this.findUserByIdentifiant(identifiant);
        if (!user || !(await bcrypt.compare(password || '', user.mot_de_passe))) {
            throw new Error('Identifiants invalides');
        }
        await db.sequelize.transaction((transaction) => this.destroyUnreferencedUser(user, transaction));
        return { deleted: true };
    }

    async createUserByAdmin(payload, actor) {
        this.assertActorCenter(actor);
        const nomComplet = String(payload.nom_complet || payload.name || '').trim();
        const email = String(payload.email || '').trim().toLowerCase();
        const matricule = String(payload.matricule || '').trim();
        const telephone = String(payload.telephone || '').trim() || null;

        if (!nomComplet || !email || !matricule || !payload.role_id) {
            const error = new Error('Nom complet, email, matricule et rôle sont obligatoires.');
            error.statusCode = 400;
            throw error;
        }

        const duplicate = await db.Utilisateur.findOne({
            where: {
                [db.Sequelize.Op.or]: [{ email }, { matricule }]
            }
        });
        if (duplicate) {
            const error = new Error(duplicate.email === email
                ? 'Un compte utilise déjà cette adresse email.'
                : 'Un compte utilise déjà ce matricule.');
            error.statusCode = 409;
            throw error;
        }

        const selectedRole = await db.Role.findByPk(payload.role_id);
        if (selectedRole && ['admin', 'super_admin'].includes(toCanonicalRole(selectedRole.libelle))) {
            const error = new Error('La création des comptes Admin est réservée au Super Admin.');
            error.statusCode = 403;
            throw error;
        }
        const roleId = await this.resolveRequestedRole({ role_id: payload.role_id });
        if (!selectedRole || ['admin', 'super_admin'].includes(toCanonicalRole(selectedRole.libelle))) {
            const error = new Error('La création des comptes Admin est réservée au Super Admin.');
            error.statusCode = 403;
            throw error;
        }
        const centreId = actor.role === 'super_admin'
            ? String(payload.centre_id || '').trim()
            : actor.centerId;
        const centre = await db.Centre.findOne({ where: { id: centreId, active: true } });
        if (!centre) {
            const error = new Error('Un centre actif est obligatoire.');
            error.statusCode = 400;
            throw error;
        }
        const chefOperationnelId = await this.validateRequestedChef(
            roleId,
            centreId,
            payload.chef_operationnel_id
        );
        const temporaryPassword = this.generateTemporaryPassword();
        let userId;

        await db.sequelize.transaction(async (transaction) => {
            await this.validateAccountReferences({ role_id: roleId }, transaction, { requireRole: true });
            const user = await db.Utilisateur.create({
                nom_complet: nomComplet,
                email,
                matricule,
                telephone,
                role_id: roleId,
                centre_id: centreId,
                poste_id: null,
                da_id: null,
                zone_id: null,
                id_manager: chefOperationnelId,
                statut: 'actif',
                mot_de_passe: await bcrypt.hash(temporaryPassword, 10),
                must_change_password: true
            }, { transaction });
            userId = user.id;

            await this.recordAudit({
                utilisateur_id: actor.id,
                action: 'utilisateur_cree',
                entite: 'utilisateur',
                entite_id: user.id,
                details: { email, matricule, role_id: roleId, centre_id: centreId, chef_operationnel_id: chefOperationnelId, source: 'administration' }
            }, transaction);
        });

        const user = await this.getUser(userId);
        const emailNotification = await emailService.sendAccountCreated({
            email,
            name: nomComplet,
            temporaryPassword
        });
        return { ...user.toJSON(), temporaryPassword, emailNotification };
    }

    async deleteUserByAdmin(userId, actor) {
        const user = await db.Utilisateur.findByPk(userId, {
            include: [{ model: db.Role, as: 'role' }]
        });
        if (!user) {
            const error = new Error('Compte introuvable');
            error.statusCode = 404;
            throw error;
        }
        await this.assertManageableUser(actor, user);
        if (String(user.id) === String(actor.id)) {
            const error = new Error('Vous ne pouvez pas supprimer votre propre compte administrateur.');
            error.statusCode = 400;
            throw error;
        }

        const isActiveAdmin = normalizeRole(user.role && user.role.libelle) === 'admin' && user.statut === 'actif';
        if (isActiveAdmin) {
            const adminRoles = await db.Role.findAll();
            const adminRoleIds = adminRoles
                .filter((role) => ['admin', 'administrateur'].includes(normalizeRole(role.libelle)))
                .map((role) => role.id);
            const activeAdminCount = await db.Utilisateur.count({
                where: { role_id: { [db.Sequelize.Op.in]: adminRoleIds }, statut: 'actif' }
            });
            if (activeAdminCount <= 1) {
                const error = new Error('Impossible de supprimer le dernier administrateur actif.');
                error.statusCode = 409;
                throw error;
            }
        }

        await db.sequelize.transaction(async (transaction) => {
            await this.destroyUnreferencedUser(user, transaction);
            await this.recordAudit({
                utilisateur_id: actor.id,
                action: 'utilisateur_supprime',
                entite: 'utilisateur',
                entite_id: user.id,
                details: {
                    email: user.email,
                    matricule: user.matricule,
                    role_id: user.role_id,
                    centre_id: user.centre_id,
                    source: 'administration'
                }
            }, transaction);
        });
        return { id: user.id, deleted: true };
    }

    async recordAudit(entry, transaction) {
        if (db.AuditLog) {
            await db.AuditLog.create({
                utilisateur_id: entry.utilisateur_id || null,
                action: entry.action,
                entite: entry.entite || 'demande_acces',
                entite_id: entry.entite_id || null,
                details: typeof entry.details === 'string'
                    ? entry.details
                    : JSON.stringify(entry.details || {})
            }, { transaction });
        }
    }

    // Approuve une demande d'accès : associe le rôle demandé et, lorsqu'il
    // existe, le poste historique à l'utilisateur.
    // `updateStatut` est le code de décision partagé avec rejectAccount.
    async decideDemande(demandeId, { statut, actor, motif } = {}) {
        const demande = await db.DemandeAcces.findByPk(demandeId, {
            include: [{ model: db.Utilisateur, as: 'user' }]
        });
        if (!demande) throw new Error('Demande introuvable');
        await this.assertResourceScope(actor, demande.centre_id);
        const requestedRole = await db.Role.findByPk(demande.role_id);
        if (!requestedRole || ['admin', 'super_admin'].includes(toCanonicalRole(requestedRole.libelle))) {
            const error = new Error('Une demande publique ne peut pas attribuer un rôle administrateur.');
            error.statusCode = 403;
            throw error;
        }

        let temporaryPassword;
        await db.sequelize.transaction(async (transaction) => {
            const updates = {
                statut,
                valide_par: actor.id,
                valide_le: new Date()
            };
            if (statut === 'REFUSEE') updates.motif_refus = motif || null;
            if (statut === 'APPROUVEE') updates.motif_refus = null;
            await demande.update(updates, { transaction });

            // Activation du compte avec le rôle validé par l'administrateur.
            if (statut === 'APPROUVEE' && demande.user) {
                // Mot de passe temporaire unique : 5 caractères max (lettres + chiffres).
                temporaryPassword = this.generateTemporaryPassword();
                await demande.user.update({
                    statut: 'actif',
                    role_id: demande.role_id,
                    centre_id: demande.centre_id,
                    poste_id: demande.poste_id,
                    id_manager: await this.validateRequestedChef(
                        demande.role_id,
                        demande.centre_id,
                        demande.chef_operationnel_id,
                        transaction
                    ),
                    mot_de_passe: await bcrypt.hash(temporaryPassword, 10),
                    must_change_password: true
                }, { transaction });
            }

            await this.recordAudit({
                utilisateur_id: actor.id,
                action: statut === 'APPROUVEE' ? 'demande_approuvee' : 'demande_refusee',
                entite_id: demande.id,
                details: {
                    utilisateur_id: demande.utilisateur_id,
                    email: demande.email,
                    poste_id: demande.poste_id,
                    role_id: demande.role_id,
                    centre_id: demande.centre_id,
                    chef_operationnel_id: demande.chef_operationnel_id,
                    auteur_role: actor.role,
                    motif_refus: statut === 'REFUSEE' ? (motif || null) : null,
                    valide_le: new Date().toISOString()
                }
            }, transaction);
        });

        const result = await this.getDemande(demande.id);
        const emailNotification = await emailService.sendAccountDecision({
            email: demande.email,
            name: demande.nom_complet,
            approved: statut === 'APPROUVEE',
            temporaryPassword
        });
        return { ...result.toJSON(), temporaryPassword, emailNotification };
    }

    // `id` peut être l'id d'une demande OU (compatibilité) l'id d'un utilisateur
    // en attente de réinitialisation de mot de passe.
    async approveAccount(id, actor) {
        const demande = await db.DemandeAcces.findByPk(id);
        if (demande) {
            if (demande.statut !== 'EN_ATTENTE') {
                const error = new Error('Cette demande a déjà été traitée');
                error.statusCode = 400;
                throw error;
            }
            return this.decideDemande(id, { statut: 'APPROUVEE', actor });
        }

        // Repli historique : id = utilisateur (activation / reset mot de passe).
        const user = await db.Utilisateur.findByPk(id, { include: [{ model: db.Role, as: 'role' }] });
        if (!user) {
            throw new Error('Compte introuvable');
        }

        if (user.statut === 'reset_demande') {
            return this.resetUserPassword(user.id, actor);
        }
        await this.assertManageableUser(actor, user);
        await user.update({ statut: 'actif' });
        const result = user.toJSON();
        delete result.mot_de_passe;
        return result;
    }

    // Refuse une demande : conserve la demande en base avec le statut REFUSEE
    // et enregistre le motif de refus (obligatoire).
    async rejectAccount(id, motif, actor) {
        const demande = await db.DemandeAcces.findByPk(id);
        if (demande) {
            if (demande.statut !== 'EN_ATTENTE') {
                const error = new Error('Cette demande a déjà été traitée');
                error.statusCode = 400;
                throw error;
            }
            const reason = String(motif || '').trim();
            if (!reason) {
                const error = new Error('Le motif de refus est obligatoire');
                error.statusCode = 400;
                throw error;
            }
            return this.decideDemande(id, { statut: 'REFUSEE', actor, motif: reason });
        }

        // Repli historique : suppression directe d'un utilisateur.
        const user = await db.Utilisateur.findByPk(id, { include: [{ model: db.Role, as: 'role' }] });
        if (!user) {
            throw new Error('Compte introuvable');
        }

        await this.assertManageableUser(actor, user);
        await db.sequelize.transaction((transaction) => this.destroyUnreferencedUser(user, transaction));
        const emailNotification = await emailService.sendAccountDecision({
            email: user.email,
            name: user.nom_complet,
            approved: false,
        });
        return { id, deleted: true, emailNotification };
    }

    // Envoie un message email de l'administrateur a un utilisateur.
    async sendUserMessage(userId, message, admin) {
        const text = String(message || '').trim();
        if (!text) {
            const error = new Error('Le message est obligatoire');
            error.statusCode = 400;
            throw error;
        }
        const user = await db.Utilisateur.findByPk(userId, { include: [{ model: db.Role, as: 'role' }] });
        if (!user) {
            const error = new Error('Utilisateur introuvable');
            error.statusCode = 404;
            throw error;
        }
        await this.assertManageableUser(admin, user);
        const fromName = (admin && admin.nom_complet) || 'L\'administration';
        const emailNotification = await emailService.sendUserMessage({
            toEmail: user.email,
            toName: user.nom_complet,
            fromName,
            message: text
        });
        await this.recordAudit({
            utilisateur_id: admin && admin.id ? admin.id : null,
            action: 'message_envoye',
            entite: 'utilisateur',
            entite_id: user.id,
            details: { email: user.email, centre_id: user.centre_id, extrait: text.slice(0, 120), emailNotification }
        });
        return { userId: user.id, email: user.email, ...emailNotification };
    }

    async updateUser(userId, payload, actor) {
        const user = await db.Utilisateur.findByPk(userId, { include: [{ model: db.Role, as: 'role' }] });
        if (!user) {
            throw new Error('Compte introuvable');
        }
        await this.assertManageableUser(actor, user);

        const updates = {};
        if (payload.nom_complet !== undefined) updates.nom_complet = payload.nom_complet;
        if (payload.email !== undefined) updates.email = String(payload.email).toLowerCase();
        if (payload.telephone !== undefined) updates.telephone = payload.telephone;
        if (payload.statut !== undefined) {
            if (!['actif', 'suspendu', 'inactif'].includes(payload.statut)) {
                const error = new Error('Statut utilisateur invalide.');
                error.statusCode = 400;
                throw error;
            }
            updates.statut = payload.statut;
        }
        // L'affectation partenaire est exclusivement gérée par le Chef via la
        // table d'affectations ; l'administration du compte ne modifie pas ce périmètre.
        if (payload.zone_id !== undefined) updates.zone_id = payload.zone_id || null;

        if (payload.role_id !== undefined) {
            const role = await db.Role.findByPk(payload.role_id);
            if (!role || ['admin', 'super_admin'].includes(toCanonicalRole(role.libelle))) {
                const error = new Error('Ce rôle ne peut pas être attribué depuis la gestion du centre.');
                error.statusCode = 403;
                throw error;
            }
            updates.role_id = payload.role_id;
        } else if (payload.role !== undefined) {
            const normalizedRole = String(payload.role).toLowerCase().replace(/\s+/g, '_');
            const role = await db.Role.findOne({
                where: db.Sequelize.where(
                    db.Sequelize.fn('lower', db.Sequelize.col('libelle')),
                    normalizedRole.replace(/_/g, ' ')
                )
            });
            if (!role) throw new Error('Rôle introuvable');
            if (['admin', 'super_admin'].includes(toCanonicalRole(role.libelle))) {
                const error = new Error('Ce rôle ne peut pas être attribué depuis la gestion du centre.');
                error.statusCode = 403;
                throw error;
            }
            updates.role_id = role.id;
        }

        await db.sequelize.transaction(async(transaction) => {
            await this.validateAccountReferences(updates, transaction);
            await user.update(updates, { transaction });
        });
        const result = user.toJSON();
        delete result.mot_de_passe;
        return result;
    }
}

module.exports = new AccountService();
