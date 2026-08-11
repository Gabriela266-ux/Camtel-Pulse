const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const calendarService = require('../services/calendarService');
const alertesService = require('../services/alertesService');
const auditService = require('../services/auditService');

const router = express.Router();

router.use(authenticate);

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

router.get('/audit', (req, res) => {
  const { entite } = req.query;
  const data = auditService.list(entite || null);
  res.json({ ok: true, data });
});

module.exports = router;
