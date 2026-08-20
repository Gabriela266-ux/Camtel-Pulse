const bcrypt = require('bcryptjs');
const db = require('../models');

class AccountService {
    async listUsers() {
        return db.Utilisateur.findAll({
            attributes: { exclude: ['mot_de_passe'] },
            include: [{ model: db.Role, as: 'role' }, { model: db.Da, as: 'da' }],
            order: [
                ['nom_complet', 'ASC']
            ]
        });
    }

    async listPendingAccounts() {
        return db.Utilisateur.findAll({
            attributes: { exclude: ['mot_de_passe'] },
            where: { statut: 'inactif' },
            include: [{ model: db.Role, as: 'role' }]
        });
    }

    async requestAccount(payload) {
        const email = payload.email;
        if (!email) {
            throw new Error('Email requis');
        }

        const existing = await db.Utilisateur.findOne({ where: { email: email.toLowerCase() } });
        if (existing) {
            throw new Error('Compte déjà existant');
        }

        const account = await db.Utilisateur.create({
            nom_complet: payload.name || 'Nouvel utilisateur',
            email,
            telephone: payload.telephone || null,
            mot_de_passe: await bcrypt.hash(payload.password || 'Temp123!', 10),
            role_id: payload.role_id || null,
            statut: 'inactif',
            da_id: payload.da_id || null,
            zone_id: payload.zone_id || null,
            matricule: `MAT-${Date.now()}`
        });

        const result = account.toJSON();
        delete result.mot_de_passe;
        return result;
    }

    async approveAccount(userId) {
        const user = await db.Utilisateur.findByPk(userId);
        if (!user) {
            throw new Error('Compte introuvable');
        }

        await user.update({ statut: 'actif' });
        const result = user.toJSON();
        delete result.mot_de_passe;
        return result;
    }

    async rejectAccount(userId) {
        const user = await db.Utilisateur.findByPk(userId);
        if (!user) {
            throw new Error('Compte introuvable');
        }

        await user.destroy();
        return { id: userId, deleted: true };
    }

    async updateUser(userId, payload) {
        const user = await db.Utilisateur.findByPk(userId);
        if (!user) {
            throw new Error('Compte introuvable');
        }

        const updates = {};
        if (payload.nom_complet !== undefined) updates.nom_complet = payload.nom_complet;
        if (payload.email !== undefined) updates.email = String(payload.email).toLowerCase();
        if (payload.telephone !== undefined) updates.telephone = payload.telephone;
        if (payload.statut !== undefined) updates.statut = payload.statut;
        if (payload.da_id !== undefined) updates.da_id = payload.da_id || null;
        if (payload.zone_id !== undefined) updates.zone_id = payload.zone_id || null;

        if (payload.role_id !== undefined) {
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
            updates.role_id = role.id;
        }

        await user.update(updates);
        const result = user.toJSON();
        delete result.mot_de_passe;
        return result;
    }
}

module.exports = new AccountService();