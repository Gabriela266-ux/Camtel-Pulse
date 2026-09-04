const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
const { generateMonthCalendar, computePerformanceSummary, applyCarryOver, computeSecurityStock } = require('../services/advancedBusinessService');

const router = express.Router();

router.use(authenticate);

router.get('/summary', (req, res) => {
  res.json({ ok: true, data: computePerformanceSummary() });
});

router.get('/carry-over', (req, res) => {
  const previousBalance = Number(req.query.previousBalance || 0);
  const currentStock = computeSecurityStock(req.query.objectiveMensuel || 0, 31);

  res.json({
    ok: true,
    data: {
      previousBalance,
      currentStock,
      carriedForward: applyCarryOver({ previousBalance, currentStock })
    }
  });
});

router.get('/calendar/:entityType/:entityId', (req, res) => {
  const { entityType, entityId } = req.params;
  const { objectiveMensuel, year, month } = req.query;
  const data = generateMonthCalendar({
    entityType,
    entityId,
    objectiveMensuel: Number(objectiveMensuel || 0),
    year: Number(year || new Date().getFullYear()),
    month: Number(month || new Date().getMonth() + 1)
  });
  res.json({ ok: true, data });
});

router.post('/admin-only', authorize('admin'), (req, res) => {
  res.json({ ok: true, message: 'Action réservée à l’admin' });
});

module.exports = router;
