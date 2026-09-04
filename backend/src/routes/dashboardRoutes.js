const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const db = require('../models');
const calendarService = require('../services/calendarService');
const alertesService = require('../services/alertesService');
const auditService = require('../services/auditService');
const { getEntityDashboard, getDailyRecords } = require('../services/entityDashboardService');
const { assertEntityAccess } = require('../utils/entityAccess');

const router = express.Router();

router.use(authenticate);

router.get('/centres/revenue', authorize('manager', 'admin', 'super_admin'), async (req, res, next) => {
    try {
        const monthCount = 6;
        const end = new Date();
        const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (monthCount - 1), 1));
        const months = Array.from({ length: monthCount }, (_, index) => {
            const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
            return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
        });
        const startDate = `${months[0]}-01`;
        const [centres, ventes] = await Promise.all([
            db.Centre.findAll({ attributes: ['id', 'nom_centre', 'code_centre'], order: [['nom_centre', 'ASC']] }),
            db.VenteDsmAuPos.findAll({
                where: { date_vente: { [db.Sequelize.Op.gte]: startDate } },
                attributes: ['date_vente', 'montant'],
                include: [{ model: db.Pos, as: 'pos', attributes: ['id', 'dsm_id'], include: [{ model: db.Dsm, as: 'dsm', attributes: ['id', 'da_id'], include: [{ model: db.Da, as: 'da', attributes: ['id', 'centre_id'], include: [{ model: db.Centre, as: 'centre', attributes: ['id'] }] }] }] }]
            })
        ]);
        const totals = new Map(centres.map((centre) => [String(centre.id), new Map(months.map((month) => [month, 0]))]));
        ventes.forEach((vente) => {
            const centreId = vente.pos?.dsm?.da?.centre?.id;
            const month = String(vente.date_vente).slice(0, 7);
            if (centreId && totals.has(String(centreId)) && totals.get(String(centreId)).has(month)) {
                const byMonth = totals.get(String(centreId));
                byMonth.set(month, byMonth.get(month) + Number(vente.montant || 0));
            }
        });
        const data = centres.map((centre) => {
            const monthly = months.map((month) => ({ month, montant: Math.round(totals.get(String(centre.id)).get(month) * 100) / 100 }));
            return { id: String(centre.id), nom: centre.nom_centre, code: centre.code_centre, monthly, total: monthly.reduce((sum, item) => sum + item.montant, 0) };
        });
        const criticalCases = [];
        for (const centre of centres) {
            const dashboard = await getEntityDashboard('CENTRE', String(centre.id), months.at(-1));
            if (dashboard && dashboard.kpi && dashboard.kpi.statut_alerte === 'CRITIQUE') {
                criticalCases.push({ type: 'CENTRE', nom: centre.nom_centre, centre: centre.nom_centre, message: 'Indicateur sous le seuil de sécurité' });
            }
        }
        return res.json({ ok: true, data: { months, centres: data, criticalCases } });
    } catch (error) {
        return next(error);
    }
});

// Attendu par le frontend : GET /api/dashboard?type=CENTRE|DA|DSM|POS&id=...
router.get('/', async(req, res, next) => {
    try {
        const { type, id, month } = req.query;

        if (!type || !id) {
            return res.status(400).json({ ok: false, message: 'Paramètres type et id requis' });
        }
        await assertEntityAccess(req.user, type, id);

        const data = await getEntityDashboard(String(type).toUpperCase(), String(id), month ? String(month) : undefined);

        if (!data) {
            return res.status(404).json({ ok: false, message: 'Entité introuvable' });
        }

        return res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

// Historique journalier réel utilisé par le tableau de suivi (DailyTrackingTable).
// GET /api/dashboard/records?type=DA|DSM|POS|CENTRE&id=...&month=YYYY-MM (mois courant par défaut)
router.get('/records', async (req, res, next) => {
  try {
    const { type, id, month } = req.query;

    if (!type || !id) {
      return res.status(400).json({ ok: false, message: 'Paramètres type et id requis' });
    }
    await assertEntityAccess(req.user, type, id);

    const data = await getDailyRecords(String(type).toUpperCase(), String(id), month);
    if (data === null) {
      return res.status(404).json({ ok: false, message: 'Entité introuvable' });
    }
    return res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/audit', async(req, res, next) => {
    try {
        // Format enrichi attendu par la page « Modifications » (auteur, rôle, partenaire, type).
        const data = await auditService.listForModifications(req.user);
        const scoped = req.user.role === 'operationnel'
            ? data.filter((entry) => String(entry.auteurId || '') === String(req.user.id))
            : data;
        res.json({ ok: true, data: scoped });
    } catch (error) {
        next(error);
    }
});

router.get('/calendar/:entityType/:entityId', (req, res) => {
    const { entityType, entityId } = req.params;
    const data = calendarService.getCurrentMonthForEntity(entityId, entityType);
    res.json({ ok: true, data });
});

router.get('/alerts/:type/:entityId', (req, res) => {
    const { type, entityId } = req.params;
    const data = type === 'dsm' ? alertesService.evaluateDsm(entityId) : alertesService.evaluatePos(entityId);
    res.json({ ok: true, data });
});

module.exports = router;
