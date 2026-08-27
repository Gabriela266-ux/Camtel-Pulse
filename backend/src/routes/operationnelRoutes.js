const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const db = require('../models');
const auditService = require('../services/auditService');

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

// Retourne la liste des utilisateurs opérationnels rattachés au centre fourni.
// Les opérationnels non encore affectés à un partenaire (da_id null) sont inclus,
// car ils relèvent du périmètre de gestion du centre.
async function findOperationnels(centerId) {
    const users = await db.Utilisateur.findAll({
        attributes: { exclude: ['mot_de_passe'] },
        include: [
            { model: db.Role, as: 'role' },
            { model: db.Da, as: 'da', include: [{ model: db.Centre, as: 'centre' }] },
            { model: db.Dsm, as: 'dsm' },
            { model: db.Pos, as: 'pos' },
            { model: db.DemandeAcces, as: 'demandesAcces', attributes: ['id', 'statut'], required: false },
        ],
    });

    return users.filter((u) => {
        if (u.statut !== 'actif') return false;
        const role = normalizeRole(u.role && u.role.libelle);
        if (role !== 'operationnel') return false;
        if (!(u.demandesAcces || []).some((demande) => demande.statut === 'APPROUVEE')) return false;
        // Administrateur (scope centre nul) / opérationnel non affecté : tout le réseau géré.
        if (!centerId) return true;
        if (!u.da_id) return true; // non affecté -> toujours dans le scope géré
        const centre = u.da && (u.da.centre_id || (u.da.centre && u.da.centre.id));
        return centre === centerId;
    });
}

// Fait correspondre un utilisateur opérationnel au format attendu par le frontend.
function toOperationnelShape(u) {
    return {
        id: String(u.id),
        nom_complet: u.nom_complet,
        email: u.email,
        role: 'OPERATIONNEL',
        partenaireId: u.da_id ? String(u.da_id) : undefined,
    };
}

function toAssignmentShape(u) {
    return {
        userId: String(u.id),
        nomComplet: u.nom_complet,
        email: u.email,
        partenaireId: u.da_id ? String(u.da_id) : undefined,
        partenaireNom: u.da ? u.da.nom : undefined,
        dsmId: u.dsm_id ? String(u.dsm_id) : undefined,
        posId: u.pos_id ? String(u.pos_id) : undefined,
        statut: u.statut || 'actif',
    };
}

// 1. GET /api/operationnels
// Un ADMIN / MANAGER / CHEF_OPE reçoit la liste complète du centre ;
// un OPERATIONNEL ne reçoit que son propre profil.
router.get('/operationnels', async(req, res, next) => {
    try {
        if (req.user.role === 'operationnel') {
            const self = await db.Utilisateur.findByPk(req.user.id, {
                attributes: { exclude: ['mot_de_passe'] },
                include: [{ model: db.Da, as: 'da' }],
            });
            return res.json({ ok: true, data: [toOperationnelShape(self)] });
        }

        const operationnels = await findOperationnels(req.user.centerId);
        return res.json({ ok: true, data: operationnels.map(toOperationnelShape) });
    } catch (error) {
        return next(error);
    }
});

// 2. GET /api/affectations (opérationnel <-> partenaire / DSM / POS)
router.get('/affectations', authorize('admin', 'manager', 'chef_operationnel'), async(req, res, next) => {
    try {
        const operationnels = await findOperationnels(req.user.centerId);
        return res.json({ ok: true, data: operationnels.map(toAssignmentShape) });
    } catch (error) {
        return next(error);
    }
});
// 3. POST /api/partenaires (créer un partenaire, puis l'attribuer)
router.post('/partenaires', authorize('admin', 'chef_operationnel'), async(req, res, next) => {
    try {
        const body = req.body || {};
        const nom = String(body.nom || '').trim();
        if (!nom) {
            return res.status(400).json({ ok: false, message: 'Le nom du partenaire est obligatoire' });
        }

        const centreId = req.user.centerId || body.centre_id;
        if (!centreId) {
            const anyCentre = await db.Centre.findOne();
            if (!anyCentre) {
                return res.status(400).json({ ok: false, message: 'Aucun centre disponible' });
            }
        }
        const resolvedCentreId = centreId || (await db.Centre.findOne()).id;

        const centre = await db.Centre.findByPk(resolvedCentreId);
        if (!centre) {
            return res.status(404).json({ ok: false, message: 'Centre introuvable' });
        }

        const masterSim = String(body.masterSim || '').trim();
        if (!masterSim) {
            return res.status(400).json({ ok: false, message: 'La Master SIM du partenaire est obligatoire' });
        }
        const region = String(body.region || '').trim();
        if (!CAMEROON_REGIONS.has(region)) {
            return res.status(400).json({ ok: false, message: 'La région du partenaire est invalide' });
        }

        const attribution = body.attribution || {};
        if (!['OPERATIONNEL', 'CHEF'].includes(attribution.type)) {
            return res.status(400).json({ ok: false, message: 'Un responsable doit être sélectionné' });
        }
        if (attribution.type === 'OPERATIONNEL' && !attribution.userId) {
            return res.status(400).json({ ok: false, message: 'L’opérationnel doit être sélectionné' });
        }

        let operationnel;
        if (attribution.type === 'OPERATIONNEL') {
            const operationnelId = normalizeRequiredId(attribution.userId, 'operationnel_id');
            operationnel = await db.Utilisateur.findByPk(operationnelId, {
                include: [{ model: db.Da, as: 'da', include: [{ model: db.Centre, as: 'centre' }] }],
            });
            if (!operationnel) {
                return res.status(404).json({ ok: false, message: 'Opérationnel introuvable' });
            }
            const opRole = await db.Role.findByPk(operationnel.role_id);
            if (normalizeRole(opRole && opRole.libelle) !== 'operationnel') {
                return res.status(400).json({ ok: false, message: "L'utilisateur sélectionné n'est pas un opérationnel" });
            }
            const opCentre = operationnel.da && (operationnel.da.centre_id || (operationnel.da.centre && operationnel.da.centre.id));
            if (operationnel.da_id && opCentre !== resolvedCentreId) {
                return res.status(403).json({ ok: false, message: "L'opérationnel n'appartient pas à ce centre" });
            }
        }

        let partner;
        await db.sequelize.transaction(async(transaction) => {
            partner = await db.Da.create({
                centre_id: resolvedCentreId,
                code: `DA-${Date.now()}`,
                nom,
                region,
                numero_sim: masterSim,
                objectif_mensuel: 0,
                active: true,
            }, { transaction });

            if (attribution.type === 'OPERATIONNEL') {
                await operationnel.update({ da_id: partner.id, dsm_id: null, pos_id: null }, { transaction });
            }
        });
        // attribution.type === 'CHEF' : le partenaire reste rattaché au centre du chef
        // (pas de colonne dédiée chef <-> partenaire dans le modèle actuel).

        await auditService.add({
            utilisateur_id: req.user.id,
            action: 'partenaire_ajoute',
            entite: 'da',
            entite_id: partner.id,
            details: { nom, master_sim: masterSim, attribution },
        });

        return res.status(201).json({
            ok: true,
            data: {
                id: partner.id,
                nom: partner.nom,
                code: partner.code,
                date_creation: partner.createdAt,
            },
        });
    } catch (error) {
        return next(error);
    }
});

// 4. PATCH /api/affectations/:userId (bouton « Changer poste »)
router.patch('/affectations/:userId', authorize('admin', 'chef_operationnel'), async(req, res, next) => {
    try {
        const userId = normalizeRequiredId(req.params.userId, 'user_id');
        const body = req.body || {};
        const partenaireId = normalizeOptionalId(body.partenaireId, 'partenaire_id');
        const dsmId = normalizeOptionalId(body.dsmId, 'dsm_id');
        const posId = normalizeOptionalId(body.posId, 'pos_id');

        const operationnel = await db.Utilisateur.findByPk(userId, {
            include: [{ model: db.Role, as: 'role' }, { model: db.Da, as: 'da' }],
        });
        if (!operationnel) {
            return res.status(404).json({ ok: false, message: 'Utilisateur introuvable' });
        }
        if (normalizeRole(operationnel.role && operationnel.role.libelle) !== 'operationnel') {
            return res.status(400).json({ ok: false, message: "L'utilisateur ciblé n'est pas un opérationnel" });
        }

        const updates = {};
        const previousAssignment = {
            da_id: operationnel.da_id || null,
            dsm_id: operationnel.dsm_id || null,
            pos_id: operationnel.pos_id || null,
        };
        let selectedPartner = operationnel.da;
        if (partenaireId !== undefined) {
            if (partenaireId === null) {
                updates.da_id = null;
                updates.dsm_id = null;
                updates.pos_id = null;
                selectedPartner = null;
            } else {
            const partner = await db.Da.findByPk(partenaireId);
            if (!partner) {
                return res.status(404).json({ ok: false, message: 'Partenaire introuvable' });
            }
            const partnerCentre = partner.centre_id || (partner.centre && partner.centre.id);
            if (req.user.centerId && partnerCentre !== req.user.centerId) {
                return res.status(403).json({ ok: false, message: "Le partenaire n'appartient pas à ce centre" });
            }
            updates.da_id = partenaireId;
            selectedPartner = partner;
            }
        }
        if (dsmId !== undefined && updates.da_id !== null) {
            if (dsmId) {
                const dsm = await db.Dsm.findByPk(dsmId);
                if (!dsm || !selectedPartner || dsm.da_id !== selectedPartner.id) {
                    return res.status(400).json({ ok: false, message: "Le DSM n'appartient pas au partenaire sélectionné" });
                }
            }
            updates.dsm_id = dsmId;
        }
        if (posId !== undefined && updates.da_id !== null) {
            if (posId) {
                const pos = await db.Pos.findByPk(posId);
                const effectiveDsmId = updates.dsm_id !== undefined ? updates.dsm_id : operationnel.dsm_id;
                if (!pos || !effectiveDsmId || pos.dsm_id !== effectiveDsmId) {
                    return res.status(400).json({ ok: false, message: "Le POS n'appartient pas au DSM sélectionné" });
                }
            }
            updates.pos_id = posId;
        }

        if (updates.dsm_id === null) updates.pos_id = null;

        await db.sequelize.transaction(async(transaction) => {
            await operationnel.update(updates, { transaction });
        });

        const reloaded = await db.Utilisateur.findByPk(userId, {
            attributes: { exclude: ['mot_de_passe'] },
            include: [{ model: db.Da, as: 'da' }, { model: db.Dsm, as: 'dsm' }, { model: db.Pos, as: 'pos' }],
        });

        await auditService.add({
            utilisateur_id: req.user.id,
            action: 'operationnel_affecte',
            entite: 'utilisateur',
            entite_id: userId,
            details: { avant: previousAssignment, apres: updates, da_id: updates.da_id || operationnel.da_id || null },
        });

        return res.json({ ok: true, data: toAssignmentShape(reloaded) });
    } catch (error) {
        return next(error);
    }
});

// 5. PATCH /api/operationnels/:userId/statut (suspendre / réactiver un opérationnel)
router.patch('/:userId/statut', authorize('admin', 'chef_operationnel'), async(req, res, next) => {
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

        const previousStatus = operationnel.statut || 'actif';
        await operationnel.update({ statut });

        await auditService.add({
            utilisateur_id: req.user.id,
            action: statut === 'suspendu' ? 'operationnel_suspendu' : 'operationnel_active',
            entite: 'utilisateur',
            entite_id: userId,
            details: { avant: previousStatus, apres: statut, statut, da_id: operationnel.da_id || null },
        });

        const reloaded = await db.Utilisateur.findByPk(userId, {
            attributes: { exclude: ['mot_de_passe'] },
            include: [{ model: db.Da, as: 'da' }, { model: db.Dsm, as: 'dsm' }, { model: db.Pos, as: 'pos' }],
        });

        return res.json({ ok: true, data: toAssignmentShape(reloaded) });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
