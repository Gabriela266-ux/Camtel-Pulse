const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const calendarService = require('../services/calendarService');
const alertesService = require('../services/alertesService');
const auditService = require('../services/auditService');
const { getEntityDashboard } = require('../services/entityDashboardService');
const { SaisieService } = require('../services/saisieService');

const router = express.Router();

router.use(authenticate);

// Attendu par le frontend : GET /api/dashboard?type=CENTRE|DA|DSM|POS&id=...
router.get('/', async(req, res, next) => {
    try {
        const { type, id } = req.query;

        if (!type || !id) {
            return res.status(400).json({ ok: false, message: 'Paramètres type et id requis' });
        }

        const data = await getEntityDashboard(String(type).toUpperCase(), String(id));

        if (!data) {
            return res.status(404).json({ ok: false, message: 'Entité introuvable' });
        }

        if (String(type).toUpperCase() === 'POS') {
            data.records = await new SaisieService().listDailyRecords(String(id));
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
    const { entite } = req.query;
    try {
        const data = await auditService.list(entite || null);
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

module.exports = router;