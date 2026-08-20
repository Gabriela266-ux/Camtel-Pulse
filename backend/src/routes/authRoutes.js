const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', async(req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ ok: false, message: 'Email et mot de passe requis' });
    }

    try {
        const user = await db.Utilisateur.findOne({
            where: { email: email.toLowerCase() },
            include: [
                { model: db.Role, as: 'role' },
                { model: db.Da, as: 'da', include: [{ model: db.Centre, as: 'centre' }] }
            ]
        });

        if (!user) {
            return res.status(401).json({ ok: false, message: 'Identifiants invalides' });
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
                status: user.statut
            }
        });
    } catch (error) {
        console.error('[AUTH] Error:', error.message);
        return res.status(500).json({ ok: false, message: 'Erreur serveur' });
    }
});

router.get('/me', authenticate, (req, res) => {
    return res.json({ ok: true, user: req.user });
});

module.exports = router;