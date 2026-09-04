const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const db = require('../models');
const auditService = require('../services/auditService');
const {
    networkLabel,
    normalizePhone,
    normalizeZoneCode,
    partnerNetworkCode,
} = require('../utils/networkIdentity');

const router = express.Router();

const CAMEROON_REGIONS = new Set([
    'Adamaoua',
    'Centre',
    'Est',
    'Extrême-Nord',
    'Littoral',
    'Nord',
    'Nord-Ouest',
    'Ouest',
    'Sud',
    'Sud-Ouest',
]);

router.use(authenticate);

// Normalise le libellé d'un rôle ('Chef Operationnel' -> 'chef_operationnel').
function normalizeRole(libelle) {
    return String(libelle || '')
        .toLowerCase()
        .replace(/\s+/g, '_');
}

function normalizeRequiredId(value, fieldName) {
    const id = String(value === undefined || value === null ? '' : value).trim();
    if (!id || ['undefined', 'null'].includes(id.toLowerCase())) {
        const error = new Error(`${fieldName} est invalide`);
        error.statusCode = 400;
        throw error;
    }
    return id;
}

function normalizeOptionalId(value, fieldName) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const id = String(value).trim();
    if (!id || ['undefined', 'null'].includes(id.toLowerCase())) {
        const error = new Error(`${fieldName} est invalide`);
        error.statusCode = 400;
        throw error;
    }
    return id;
}

const operationnelIncludes = [
    { model: db.Role, as: 'role' },
    { model: db.Utilisateur, as: 'chefOperationnel', attributes: ['id', 'nom_complet', 'matricule'], required: false },
    { model: db.Da, as: 'da', include: [{ model: db.Centre, as: 'centre' }] },
    { model: db.Dsm, as: 'dsm' },
    { model: db.Pos, as: 'pos' },
    {
        model: db.AffectationOperationnelPartenaire,
        as: 'affectationsPartenaires',
        required: false,
        include: [{ model: db.Da, as: 'partenaire', include: [{ model: db.Centre, as: 'centre' }] }],
    },
];

// Retourne la liste des utilisateurs opérationnels rattachés au centre fourni.
// Les opérationnels non encore affectés à un partenaire (da_id null) sont inclus,
// car ils relèvent du périmètre de gestion du centre.
async function findOperationnels(centerId, chefOperationnelId = null) {
    const users = await db.Utilisateur.findAll({
        where: {
            ...(centerId ? { centre_id: centerId } : {}),
            ...(chefOperationnelId ? { id_manager: chefOperationnelId } : {}),
        },
        attributes: { exclude: ['mot_de_passe'] },
        include: [
            ...operationnelIncludes,
            { model: db.DemandeAcces, as: 'demandesAcces', attributes: ['id', 'statut'], required: false },
        ],
    });

    return users.filter((u) => {
        // Un opérationnel suspendu doit rester visible dans l'espace du Chef
        // afin de pouvoir être réactivé. Seuls les comptes réellement inactifs
        // sont retirés des listes de gestion.
        if (!['actif', 'suspendu'].includes(u.statut)) return false;
        const role = normalizeRole(u.role && u.role.libelle);
        if (role !== 'operationnel') return false;
        const demandes = u.demandesAcces || [];
        // Un compte créé directement par l'administrateur n'a pas de demande associée.
        // Lorsqu'une demande existe, elle doit en revanche être explicitement approuvée.
        if (demandes.length > 0 && !demandes.some((demande) => demande.statut === 'APPROUVEE')) return false;
        return !centerId || String(u.centre_id) === String(centerId);
    });
}

function partnerAssignments(u) {
    return (u.affectationsPartenaires || [])
        .filter((assignment) => assignment.partenaire)
        .map((assignment) => ({
            id: String(assignment.partenaire.id),
            nom: assignment.partenaire.nom,
            code: assignment.partenaire.code,
            statut: assignment.statut || 'actif',
            affectationId: String(assignment.id),
            affecteLe: assignment.created_at || assignment.createdAt || null,
        }))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

// Fait correspondre un utilisateur opérationnel au format attendu par le frontend.
function toOperationnelShape(u) {
    const partenaires = partnerAssignments(u);
    return {
        id: String(u.id),
        nom_complet: u.nom_complet,
        email: u.email,
        role: 'OPERATIONNEL',
        statut: u.statut || 'actif',
        chefOperationnel: u.chefOperationnel ? {
            id: String(u.chefOperationnel.id),
            nomComplet: u.chefOperationnel.nom_complet,
            matricule: u.chefOperationnel.matricule,
        } : null,
        partenaireIds: partenaires.map((partner) => partner.id),
        partenaires,
        // Compatibilité temporaire avec les anciens clients de l'API.
        partenaireId: partenaires[0] ? partenaires[0].id : undefined,
    };
}

function toAssignmentShape(u) {
    const partenaires = partnerAssignments(u);
    return {
        userId: String(u.id),
        nomComplet: u.nom_complet,
        email: u.email,
        partenaireIds: partenaires.map((partner) => partner.id),
        partenaires,
        partenaireId: partenaires[0] ? partenaires[0].id : undefined,
        partenaireNom: partenaires[0] ? partenaires[0].nom : undefined,
        statut: u.statut || 'actif',
        chefOperationnel: u.chefOperationnel ? {
            id: String(u.chefOperationnel.id),
            nomComplet: u.chefOperationnel.nom_complet,
            matricule: u.chefOperationnel.matricule,
        } : null,
    };
}

async function ensureUniqueNetworkPhone(phone) {
    const [partner, dsm, pos] = await Promise.all([
        db.Da.findOne({ where: { numero_sim: phone }, attributes: ['id'] }),
        db.Dsm.findOne({ where: { numero_telephone: phone }, attributes: ['id'] }),
        db.Pos.findOne({ where: { numero_telephone: phone }, attributes: ['id'] }),
    ]);
    if (partner || dsm || pos) {
        const error = new Error('Ce numéro est déjà utilisé par une autre entité du réseau');
        error.statusCode = 409;
        throw error;
    }
}

// 1. GET /api/operationnels
// Un ADMIN / MANAGER / CHEF_OPE reçoit la liste complète du centre ;
// un OPERATIONNEL ne reçoit que son propre profil.
router.get('/operationnels', async(req, res, next) => {
    try {
        if (req.user.role === 'operationnel') {
            const self = await db.Utilisateur.findByPk(req.user.id, {
                attributes: { exclude: ['mot_de_passe'] },
                include: operationnelIncludes,
            });
            return res.json({ ok: true, data: [toOperationnelShape(self)] });
        }

        const operationnels = await findOperationnels(
            ['manager', 'super_admin'].includes(req.user.role) ? null : req.user.centerId,
            req.user.role === 'chef_operationnel' ? req.user.id : null
        );
        return res.json({ ok: true, data: operationnels.map(toOperationnelShape) });
    } catch (error) {
        return next(error);
    }
});

// 2. GET /api/affectations (opérationnel <-> partenaire / DSM / POS)
router.get('/affectations', authorize('admin', 'manager', 'chef_operationnel'), async(req, res, next) => {
    try {
        const operationnels = await findOperationnels(
            ['manager', 'super_admin'].includes(req.user.role) ? null : req.user.centerId,
            req.user.role === 'chef_operationnel' ? req.user.id : null
        );
        return res.json({ ok: true, data: operationnels.map(toAssignmentShape) });
    } catch (error) {
        return next(error);
    }
});
// 3. POST /api/partenaires : la création et l'affectation sont deux actions
// distinctes. Un nouvel opérationnel ne reçoit donc jamais automatiquement le
// partenaire créé ici.
router.post('/partenaires', authorize('chef_operationnel'), async(req, res, next) => {
    try {
        const body = req.body || {};
        const nom = String(body.nom || '').trim();
        if (!nom) {
            return res.status(400).json({ ok: false, message: 'Le nom du partenaire est obligatoire' });
        }

        const centreId = req.user.centerId;
        if (!centreId) {
            return res.status(400).json({ ok: false, message: 'Aucun centre rattaché à votre compte' });
        }
        const resolvedCentreId = centreId;

        const centre = await db.Centre.findOne({ where: { id: resolvedCentreId, active: true } });
        if (!centre) {
            return res.status(404).json({ ok: false, message: 'Centre introuvable' });
        }

        const masterSim = normalizePhone(body.masterSim, 'La Master SIM');
        const codeZone = normalizeZoneCode(body.codeZone || body.code_zone);
        const region = String(body.region || '').trim();
        if (!CAMEROON_REGIONS.has(region)) {
            return res.status(400).json({ ok: false, message: 'La région du partenaire est invalide' });
        }

        let partner;
        await ensureUniqueNetworkPhone(masterSim);
        const networkCode = partnerNetworkCode(codeZone);
        await db.sequelize.transaction(async(transaction) => {
            partner = await db.Da.create({
                centre_id: resolvedCentreId,
                code: networkCode,
                nom,
                region,
                numero_sim: masterSim,
                code_zone: codeZone,
                objectif_mensuel: 0,
                active: true,
            }, { transaction });

        });

        await auditService.add({
            utilisateur_id: req.user.id,
            action: 'partenaire_ajoute',
            entite: 'da',
            entite_id: partner.id,
            details: {
                nom,
                master_sim: masterSim,
                code_zone: codeZone,
                nom_reseau: networkLabel(masterSim, networkCode),
                attribution: null,
                mode: 'creation_sans_affectation',
            },
        });

        return res.status(201).json({
            ok: true,
            data: {
                id: partner.id,
                nom: partner.nom,
                code: partner.code,
                code_zone: partner.code_zone,
                numero_sim: partner.numero_sim,
                nom_reseau: partner.nom_reseau,
                date_creation: partner.createdAt,
            },
        });
    } catch (error) {
        return next(error);
    }
});

// 4. PATCH /api/affectations/:userId
// Remplace la liste explicite des partenaires gérés par l'opérationnel. Une
// liste vide le laisse sans périmètre ; un partenaire peut figurer chez
// plusieurs opérationnels.
router.patch('/affectations/:userId', authorize('chef_operationnel'), async(req, res, next) => {
    try {
        const userId = normalizeRequiredId(req.params.userId, 'user_id');
        const body = req.body || {};
        const rawPartnerIds = Array.isArray(body.partenaireIds)
            ? body.partenaireIds
            : body.partenaireId !== undefined
                ? (normalizeOptionalId(body.partenaireId, 'partenaire_id') ? [body.partenaireId] : [])
                : null;
        if (rawPartnerIds === null) {
            return res.status(400).json({ ok: false, message: 'partenaireIds doit être un tableau' });
        }
        const partenaireIds = [...new Set(rawPartnerIds.map((value) => normalizeRequiredId(value, 'partenaire_id')))];

        const operationnel = await db.Utilisateur.findByPk(userId, {
            include: operationnelIncludes,
        });
        if (!operationnel) {
            return res.status(404).json({ ok: false, message: 'Utilisateur introuvable' });
        }
        if (normalizeRole(operationnel.role && operationnel.role.libelle) !== 'operationnel') {
            return res.status(400).json({ ok: false, message: "L'utilisateur ciblé n'est pas un opérationnel" });
        }
        if (!req.user.centerId || String(operationnel.centre_id) !== String(req.user.centerId)) {
            return res.status(403).json({ ok: false, message: "Cet opérationnel n'appartient pas à votre centre" });
        }
        if (req.user.role === 'chef_operationnel' && String(operationnel.id_manager || '') !== String(req.user.id)) {
            return res.status(403).json({ ok: false, message: "Cet opérationnel n'appartient pas à votre équipe" });
        }
        if (operationnel.statut !== 'actif' && partenaireIds.length > 0) {
            return res.status(409).json({
                ok: false,
                message: "Réactivez d'abord cet opérationnel avant de lui attribuer un partenaire",
            });
        }

        const partners = partenaireIds.length
            ? await db.Da.findAll({ where: { id: partenaireIds } })
            : [];
        if (partners.length !== partenaireIds.length) {
            return res.status(404).json({ ok: false, message: 'Un ou plusieurs partenaires sont introuvables' });
        }
        if (req.user.centerId && partners.some((partner) => String(partner.centre_id) !== String(req.user.centerId))) {
            return res.status(403).json({ ok: false, message: "Un partenaire n'appartient pas à votre centre" });
        }

        const previousIds = partnerAssignments(operationnel).map((partner) => partner.id);
        const addedIds = partenaireIds.filter((id) => !previousIds.includes(id));
        const removedIds = previousIds.filter((id) => !partenaireIds.includes(id));

        await db.sequelize.transaction(async(transaction) => {
            if (removedIds.length) {
                await db.AffectationOperationnelPartenaire.destroy({
                    where: { utilisateur_id: userId, da_id: removedIds },
                    transaction,
                });
            }
            if (addedIds.length) {
                await db.AffectationOperationnelPartenaire.bulkCreate(addedIds.map((daId) => ({
                    utilisateur_id: userId,
                    da_id: daId,
                    statut: 'actif',
                    affecte_par: req.user.id,
                })), { transaction });
            }
            // Colonne historique conservée comme pointeur primaire de compatibilité.
            await operationnel.update({
                da_id: partenaireIds[0] || null,
                dsm_id: null,
                pos_id: null,
            }, { transaction });
        });

        const reloaded = await db.Utilisateur.findByPk(userId, {
            attributes: { exclude: ['mot_de_passe'] },
            include: operationnelIncludes,
        });

        await auditService.add({
            utilisateur_id: req.user.id,
            action: partenaireIds.length ? 'operationnel_affecte' : 'operationnel_desaffecte',
            entite: 'utilisateur',
            entite_id: userId,
            details: {
                operationnel: { id: userId, nom: operationnel.nom_complet, email: operationnel.email },
                avant: previousIds,
                apres: partenaireIds,
                ajoutes: addedIds,
                retires: removedIds,
                partenaires: partners.map((partner) => ({ id: partner.id, nom: partner.nom })),
                centre_id: req.user.centerId,
                da_id: partenaireIds[0] || previousIds[0] || null,
            },
        });

        return res.json({ ok: true, data: toAssignmentShape(reloaded) });
    } catch (error) {
        return next(error);
    }
});

// 5. PATCH /api/operationnels/:userId/statut (suspendre / réactiver un opérationnel)
router.patch('/operationnels/:userId/statut', authorize('chef_operationnel'), async(req, res, next) => {
    try {
        const userId = normalizeRequiredId(req.params.userId, 'user_id');
        const { statut } = req.body || {};

        if (!['actif', 'suspendu', 'inactif'].includes(statut)) {
            return res.status(400).json({ ok: false, message: 'Statut invalide (actif, suspendu, inactif)' });
        }

        const operationnel = await db.Utilisateur.findByPk(userId, {
            include: [{ model: db.Role, as: 'role' }, { model: db.Da, as: 'da' }],
        });
        if (!operationnel) {
            return res.status(404).json({ ok: false, message: 'Utilisateur introuvable' });
        }
        if (normalizeRole(operationnel.role && operationnel.role.libelle) !== 'operationnel') {
            return res.status(400).json({ ok: false, message: "L'utilisateur ciblé n'est pas un opérationnel" });
        }
        if (!req.user.centerId || String(operationnel.centre_id) !== String(req.user.centerId)) {
            return res.status(403).json({ ok: false, message: "Cet opérationnel n'appartient pas à votre centre" });
        }
        if (String(operationnel.id_manager || '') !== String(req.user.id)) {
            return res.status(403).json({ ok: false, message: "Cet opérationnel n'appartient pas à votre équipe" });
        }

        const previousStatus = operationnel.statut || 'actif';
        await operationnel.update({ statut });

        await auditService.add({
            utilisateur_id: req.user.id,
            action: statut === 'suspendu' ? 'operationnel_suspendu' : 'operationnel_active',
            entite: 'utilisateur',
            entite_id: userId,
            details: { avant: previousStatus, apres: statut, statut, da_id: operationnel.da_id || null, centre_id: req.user.centerId },
        });

        const reloaded = await db.Utilisateur.findByPk(userId, {
            attributes: { exclude: ['mot_de_passe'] },
            include: operationnelIncludes,
        });

        return res.json({ ok: true, data: toAssignmentShape(reloaded) });
    } catch (error) {
        return next(error);
    }
});

// Transfert hiérarchique d'un opérationnel entre deux Chefs du même centre.
// L'Admin du centre (ou le Super Admin) arbitre le transfert afin qu'un Chef
// ne puisse pas récupérer un membre de l'équipe d'un autre Chef.
router.patch('/operationnels/:userId/chef', authorize('admin', 'super_admin'), async(req, res, next) => {
    try {
        const userId = normalizeRequiredId(req.params.userId, 'user_id');
        const chefId = normalizeRequiredId(req.body && req.body.chef_operationnel_id, 'chef_operationnel_id');
        const operationnel = await db.Utilisateur.findByPk(userId, {
            include: [{ model: db.Role, as: 'role' }, { model: db.Utilisateur, as: 'chefOperationnel' }],
        });
        if (!operationnel || normalizeRole(operationnel.role && operationnel.role.libelle) !== 'operationnel') {
            return res.status(404).json({ ok: false, message: 'Opérationnel introuvable' });
        }
        if (req.user.role !== 'super_admin' && String(operationnel.centre_id || '') !== String(req.user.centerId || '')) {
            return res.status(403).json({ ok: false, message: "Cet opérationnel n'appartient pas à votre centre" });
        }

        const nouveauChef = await db.Utilisateur.findByPk(chefId, { include: [{ model: db.Role, as: 'role' }] });
        if (!nouveauChef
            || nouveauChef.statut !== 'actif'
            || normalizeRole(nouveauChef.role && nouveauChef.role.libelle) !== 'chef_operationnel') {
            return res.status(400).json({ ok: false, message: 'Chef opérationnel actif introuvable' });
        }
        if (String(nouveauChef.centre_id || '') !== String(operationnel.centre_id || '')) {
            return res.status(400).json({ ok: false, message: 'Le Chef et l’opérationnel doivent appartenir au même centre' });
        }

        const ancienChef = operationnel.chefOperationnel;
        await operationnel.update({ id_manager: nouveauChef.id });
        await auditService.add({
            utilisateur_id: req.user.id,
            action: 'operationnel_transfere_chef',
            entite: 'utilisateur',
            entite_id: operationnel.id,
            details: {
                centre_id: operationnel.centre_id,
                operationnel: { id: operationnel.id, nom: operationnel.nom_complet },
                avant: ancienChef ? { id: ancienChef.id, nom: ancienChef.nom_complet } : null,
                apres: { id: nouveauChef.id, nom: nouveauChef.nom_complet },
            },
        });

        const reloaded = await db.Utilisateur.findByPk(userId, {
            attributes: { exclude: ['mot_de_passe'] },
            include: operationnelIncludes,
        });
        return res.json({ ok: true, data: toAssignmentShape(reloaded) });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
