const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models');
const { authenticate } = require('../middlewares/authMiddleware');
const { toCanonicalRole } = require('../utils/roles');
const { randomUUID } = require('crypto');
const redis = require('../config/redis');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.post('/login', [
    body('identifiant').optional().isString().trim().isLength({ min: 2, max: 150 }),
    body('matricule').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('password').isString().isLength({ min: 1, max: 256 }),
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ ok: false, message: 'Données de connexion invalides', errors: errors.array() });
    const { matricule, identifiant, password } = req.body || {};
    const loginField = matricule || identifiant;

    if (!loginField || !password) {
        return res.status(400).json({ ok: false, message: 'Identifiant et mot de passe requis' });
    }

    try {
        const normalizedLogin = String(loginField).trim();
        const whereClause = {
            [db.Sequelize.Op.or]: [
                { matricule: normalizedLogin },
                { email: normalizedLogin }
            ]
        };

        const user = await db.Utilisateur.findOne({
            where: whereClause,
            include: [
                { model: db.Role, as: 'role' },
                { model: db.Centre, as: 'centre', required: false },
                { model: db.Utilisateur, as: 'chefOperationnel', attributes: ['id', 'nom_complet', 'matricule'], required: false },
                { model: db.Da, as: 'da', include: [{ model: db.Centre, as: 'centre' }] },
                {
                    model: db.AffectationOperationnelPartenaire,
                    as: 'affectationsPartenaires',
                    required: false,
                    where: { statut: 'actif' },
                    include: [{ model: db.Da, as: 'partenaire' }]
                }
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
        const role = toCanonicalRole(user.role && user.role.libelle);
        if (!role) {
            return res.status(403).json({ ok: false, message: 'Rôle du compte non reconnu' });
        }
        if (role !== 'super_admin' && !user.centre_id) {
            return res.status(403).json({ ok: false, message: 'Aucun centre organisationnel rattaché à ce compte' });
        }
        if (role !== 'super_admin' && user.centre && !Boolean(user.centre.active)) {
            return res.status(403).json({ ok: false, message: 'Votre centre est temporairement désactivé' });
        }

        const sessionId = randomUUID();
        const token = jwt.sign({ sub: user.id, email: user.email, role, da_id: user.da_id, centerId: user.centre_id || null, jti: sessionId },
            process.env.JWT_SECRET || 'camtel-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );
        await redis.createSession(sessionId, { userId: user.id, role }, 8 * 60 * 60);
        await redis.publish('auth', { event: 'login', userId: user.id, role });

        const activeAssignments = user.affectationsPartenaires || [];
        const partenaires = activeAssignments
            .filter((assignment) => assignment.partenaire)
            .map((assignment) => ({
                id: String(assignment.partenaire.id),
                nom: assignment.partenaire.nom,
                code: assignment.partenaire.code,
            }));
        const centerId = user.centre_id || null;

        return res.json({
            ok: true,
            token,
            user: {
                id: user.id,
                name: user.nom_complet,
                email: user.email,
                role,
                da_id: user.da_id,
                partenaire_ids: partenaires.map((partner) => partner.id),
                partenaires,
                centerId,
                centre: user.centre ? {
                    id: user.centre.id,
                    code_centre: user.centre.code_centre,
                    nom_centre: user.centre.nom_centre,
                    region: user.centre.region,
                } : null,
                chef_operationnel: user.chefOperationnel ? {
                    id: String(user.chefOperationnel.id),
                    nom_complet: user.chefOperationnel.nom_complet,
                    matricule: user.chefOperationnel.matricule,
                } : null,
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
