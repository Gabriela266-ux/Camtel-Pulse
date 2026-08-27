const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', async(req, res) => {
    const { email, identifiant, password } = req.body || {};
    const loginField = identifiant || email;

    if (!loginField || !password) {
        return res.status(400).json({ ok: false, message: 'Identifiant et mot de passe requis' });
    }

    try {
        // Recherche par matricule OU email
        const whereClause = {
            [db.Sequelize.Op.or]: [
                { email: String(loginField).toLowerCase() },
                { matricule: String(loginField) }
            ]
        };

        const user = await db.Utilisateur.findOne({
            where: whereClause,
            include: [
                { model: db.Role, as: 'role' },
                { model: db.Da, as: 'da', include: [{ model: db.Centre, as: 'centre' }] }
            ]
        });

        if (!user) {
            return res.status(401).json({ ok: false, message: 'Identifiants invalides' });
        }

        if (user.statut !== 'actif') {
            return res.status(403).json({ ok: false, message: 'Compte en attente de validation par un administrateur' });
        }

        const isValid = await bcrypt.compare(password, user.mot_de_passe);

        if (!isValid) {
            return res.status(401).json({ ok: false, message: 'Identifiants invalides' });
        }

        // Normalise le rôle en snake_case minuscule pour les vérifications RBAC
        // et l'affichage frontend (la table role stocke des libellés type 'Admin', 'Agent').
        const role = user.role.libelle.toLowerCase().replace(/\s+/g, '_');

        const token = jwt.sign({ sub: user.id, email: user.email, role, da_id: user.da_id },
            process.env.JWT_SECRET || 'camtel-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        return res.json({
            ok: true,
            token,
            user: {
                id: user.id,
                name: user.nom_complet,
                email: user.email,
                role,
                da_id: user.da_id,
                centerId: user.da && (user.da.centre_id || (user.da.centre && user.da.centre.id)) || null,
                status: user.statut,
                must_change_password: Boolean(user.must_change_password)
            }
        });
    } catch (error) {
        console.error('[AUTH] Error:', error.message);
        return res.status(500).json({ ok: false, message: 'Erreur serveur' });
    }
});

router.post('/change-temporary-password', authenticate, async(req, res, next) => {
    try {
        const currentPassword = String((req.body && req.body.currentPassword) || '');
        const newPassword = String((req.body && req.body.newPassword) || '');
        if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
            return res.status(400).json({ ok: false, message: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre' });
        }
        const user = await db.Utilisateur.findByPk(req.user.id);
        if (!user || !user.must_change_password || !(await bcrypt.compare(currentPassword, user.mot_de_passe))) {
            return res.status(400).json({ ok: false, message: 'Mot de passe temporaire invalide' });
        }
        await user.update({ mot_de_passe: await bcrypt.hash(newPassword, 10), must_change_password: false });
        return res.json({ ok: true, data: { changed: true } });
    } catch (error) {
        return next(error);
    }
});

router.get('/me', authenticate, (req, res) => {
    return res.json({ ok: true, user: req.user });
});

module.exports = router;
