const jwt = require('jsonwebtoken');
const db = require('../models');
const { toCanonicalRole } = require('../utils/roles');
const redis = require('../config/redis');
const { userRateLimit } = require('./security');

async function authenticate(req, res, next) {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
        return res.status(401).json({ ok: false, message: 'Token manquant' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'camtel-secret');

        if (redis.status().enabled && !(await redis.isSessionActive(decoded.jti))) {
            return res.status(401).json({ ok: false, message: 'Session expirée ou révoquée' });
        }

        const user = await db.Utilisateur.findOne({
            where: { id: decoded.sub },
            include: [
                { model: db.Role, as: 'role' },
                { model: db.Centre, as: 'centre', required: false },
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
            return res.status(401).json({ ok: false, message: 'Utilisateur introuvable' });
        }

        if (user.statut !== 'actif') {
            return res.status(403).json({ ok: false, message: 'Compte suspendu ou inactif' });
        }

        const role = toCanonicalRole(user.role && user.role.libelle);
        if (!role) {
            return res.status(403).json({ ok: false, message: 'Rôle du compte non reconnu' });
        }

        const activeAssignments = user.affectationsPartenaires || [];
        const partnerIds = activeAssignments.map((assignment) => String(assignment.da_id));
        const centerId = user.centre_id || null;
        if (role !== 'super_admin' && !centerId) {
            return res.status(403).json({ ok: false, message: 'Aucun centre organisationnel rattaché à ce compte' });
        }
        if (role !== 'super_admin' && user.centre && !Boolean(user.centre.active)) {
            return res.status(403).json({ ok: false, message: 'Votre centre est temporairement désactivé' });
        }

        req.user = {
            id: user.id,
            nom_complet: user.nom_complet,
            email: user.email,
            role,
            da_id: user.da_id,
            partnerIds,
            centerId,
            centre: user.centre ? {
                id: user.centre.id,
                code_centre: user.centre.code_centre,
                nom_centre: user.centre.nom_centre,
                region: user.centre.region,
            } : null,
            status: user.statut,
            must_change_password: Boolean(user.must_change_password)
        };

                return userRateLimit(req, res, () => {
                    if (user.must_change_password && !String(req.originalUrl || '').includes('/auth/change-temporary-password')) {
                        return res.status(403).json({ ok: false, code: 'PASSWORD_CHANGE_REQUIRED', message: 'Vous devez modifier votre mot de passe temporaire.' });
                    }
                    return next();
                });

    } catch {
        return res.status(401).json({ ok: false, message: 'Token invalide ou expiré' });
    }
}

function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ ok: false, message: 'Authentification requise' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ ok: false, message: 'Droits insuffisants' });
        }

        return next();
    };
}

module.exports = { authenticate, authorize };
