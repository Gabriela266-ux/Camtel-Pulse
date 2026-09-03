const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const calendarService = require('../services/calendarService');
const alertesService = require('../services/alertesService');
const auditService = require('../services/auditService');
const { getEntityDashboard, getDailyRecords } = require('../services/entityDashboardService');
const { assertEntityAccess } = require('../utils/entityAccess');

const router = express.Router();

router.use(authenticate);

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

module.exports = router;
