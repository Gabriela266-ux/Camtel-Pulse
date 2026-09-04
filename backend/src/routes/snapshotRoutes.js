const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const db = require('../models');
const auditService = require('../services/auditService');
const { assertEntityAccess, resolveCenterId } = require('../utils/entityAccess');

const router = express.Router();

router.use(authenticate);

// Rôles autorisés à ENREGISTRER un tableau (le Manager est lecture seule).
const CAN_SAVE = ['chef_operationnel', 'operationnel'];
// Rôles autorisés à CONSULTER / TÉLÉCHARGER les tableaux stockés.
const CAN_VIEW = ['super_admin', 'admin', 'manager', 'chef_operationnel'];
const CAN_DELETE = ['chef_operationnel'];

function computeTotals(records) {
    const sumStock = records.reduce((s, r) => s + Number(r.stock_journalier || 0), 0);
    const sumPrevision = records.reduce((s, r) => s + Number(r.prevision_ca || 0), 0);
    const sumAchat = records.reduce((s, r) => s + Number(r.achat || 0), 0);
    const cumulFinal = records.length ? Number(records[records.length - 1].cumul_achat || 0) : 0;
    return {
        total_stock: Math.round(sumStock * 100) / 100,
        total_prevision: Math.round(sumPrevision * 100) / 100,
        total_achat: Math.round(sumAchat * 100) / 100,
        cumul_achat_final: Math.round(cumulFinal * 100) / 100
    };
}

// POST /api/snapshots — enregistre le tableau courant (immuable ensuite).
router.post('/', authorize(...CAN_SAVE), async(req, res, next) => {
    try {
        const body = req.body || {};
        const records = Array.isArray(body.records) ? body.records : [];
        if (!records.length) {
            return res.status(400).json({ ok: false, message: 'Aucune ligne à enregistrer' });
        }
        if (!body.entite_type || !body.entite_id) {
            return res.status(400).json({ ok: false, message: 'entite_type et entite_id sont obligatoires' });
        }
        await assertEntityAccess(req.user, body.entite_type, body.entite_id);

        const periode = String(body.periode || new Date().toISOString().slice(0, 7));
        const totals = computeTotals(records);

        // Un seul snapshot par entité/période : on remplace l'existant (pas d'historique dupliqué).
        const existing = await db.TableSnapshot.findOne({
            where: { entite_type: body.entite_type, entite_id: body.entite_id, periode }
        });

        let snapshot;
        if (existing) {
            await existing.update({
                entite_nom: body.entite_nom || existing.entite_nom,
                lignes: records.length,
                payload: JSON.stringify(records),
                ...totals,
                created_by: req.user.id
            });
            snapshot = existing;
        } else {
            snapshot = await db.TableSnapshot.create({
                entite_type: body.entite_type,
                entite_id: body.entite_id,
                entite_nom: body.entite_nom || null,
                periode,
                lignes: records.length,
                payload: JSON.stringify(records),
                ...totals,
                created_by: req.user.id
            });
        }

        await auditService.add({
            utilisateur_id: req.user.id,
            action: 'snapshot_enregistre',
            entite: 'table_snapshot',
            entite_id: snapshot.id,
            details: { centre_id: req.user.centerId || null, entite_type: body.entite_type, entite_id: body.entite_id, periode, lignes: records.length }
        });

        return res.status(existing ? 200 : 201).json({
            ok: true,
            data: { id: snapshot.id, periode, lignes: records.length, ...totals }
        });
    } catch (error) {
        return next(error);
    }
});

// GET /api/snapshots — liste consultable par Admin / Manager / Chef.
router.get('/', authorize(...CAN_VIEW), async(req, res, next) => {
    try {
        const snapshots = await db.TableSnapshot.findAll({
            attributes: { exclude: ['payload'] },
            include: [{
                model: db.Utilisateur,
                as: 'auteur',
                attributes: ['id', 'nom_complet']
            }],
            order: [
                ['created_at', 'DESC']
            ]
        });
        const scopedSnapshots = [];
        for (const snapshot of snapshots) {
            const centerId = await resolveCenterId(snapshot.entite_type, snapshot.entite_id);
            if (req.user.role === 'super_admin' || String(centerId || '') === String(req.user.centerId || '')) {
                scopedSnapshots.push(snapshot);
            }
        }
        return res.json({
            ok: true,
            data: scopedSnapshots.map((s) => ({
                id: s.id,
                entite_type: s.entite_type,
                entite_id: s.entite_id,
                entite_nom: s.entite_nom,
                periode: s.periode,
                lignes: s.lignes,
                total_stock: Number(s.total_stock),
                total_prevision: Number(s.total_prevision),
                total_achat: Number(s.total_achat),
                cumul_achat_final: Number(s.cumul_achat_final),
                created_at: s.created_at,
                auteur: s.auteur ? s.auteur.nom_complet : null
            }))
        });
    } catch (error) {
        return next(error);
    }
});

// DELETE /api/snapshots/:id — suppression réservée à l'administrateur.
router.delete('/:id', authorize(...CAN_DELETE), async(req, res, next) => {
    try {
        const snapshot = await db.TableSnapshot.findByPk(req.params.id);
        if (!snapshot) return res.status(404).json({ ok: false, message: 'Tableau introuvable' });
        await assertEntityAccess(req.user, snapshot.entite_type, snapshot.entite_id);
        await db.sequelize.transaction(async(transaction) => {
            await snapshot.destroy({ transaction });
        });
        return res.json({ ok: true, data: { id: req.params.id, deleted: true } });
    } catch (error) {
        return next(error);
    }
});

// GET /api/snapshots/:id/download — téléchargement CSV (lecture seule).
router.get('/:id/download', authorize(...CAN_VIEW), async(req, res, next) => {
    try {
        const snapshot = await db.TableSnapshot.findByPk(req.params.id);
        if (!snapshot) {
            return res.status(404).json({ ok: false, message: 'Tableau introuvable' });
        }
        await assertEntityAccess(req.user, snapshot.entite_type, snapshot.entite_id);

        const records = JSON.parse(snapshot.payload || '[]');
        const headers = [
            'Date', 'Calendrier Achat (U)', 'Achat (U)', 'Stock Journalier (U)',
            'Cumul achat (U)', 'Consommation (U)', 'Ecart jour', 'Ecart cumule', 'Statut'
        ];
        const escapeCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = records.map((r) => [
            r.date, r.prevision_ca, r.achat,
            r.stock_journalier !== null && r.stock_journalier !== undefined ? r.stock_journalier : '',
            r.cumul_achat,
            r.consommation !== null && r.consommation !== undefined ? r.consommation : '',
            r.ecart_jour, r.ecart_cumule, r.statut
        ].map(escapeCsv).join(';'));

        const totalsRow = [
            'TOTAL', snapshot.total_prevision, snapshot.total_achat, snapshot.total_stock,
            snapshot.cumul_achat_final, '', '', '', ''
        ].map(escapeCsv).join(';');

        const csv = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows, '', totalsRow].join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="suivi-${snapshot.entite_type}-${snapshot.periode}.csv"`
        );
        return res.send(csv);
    } catch (error) {
        return next(error);
    }
});

// GET /api/snapshots/:id/view — consultation détaillée d'un tableau stocké.
router.get('/:id/view', authorize(...CAN_VIEW), async(req, res, next) => {
    try {
        const snapshot = await db.TableSnapshot.findByPk(req.params.id, {
            include: [{ model: db.Utilisateur, as: 'auteur', attributes: ['id', 'nom_complet'] }]
        });
        if (!snapshot) return res.status(404).json({ ok: false, message: 'Tableau introuvable' });
        await assertEntityAccess(req.user, snapshot.entite_type, snapshot.entite_id);

        return res.json({
            ok: true,
            data: {
                ...snapshot.toJSON(),
                payload: JSON.parse(snapshot.payload || '[]'),
                auteur: snapshot.auteur ? snapshot.auteur.nom_complet : null
            }
        });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
