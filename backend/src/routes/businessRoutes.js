const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const organizationService = require('../services/organizationService');
const salesService = require('../services/salesService');
const { calculateSecurityStock } = require('../utils/business');

const router = express.Router();

router.use(authenticate);

router.get('/organization/tree', async (req, res) => {
  const data = await organizationService.getTree();
  res.json({ ok: true, data });
});

router.get('/organization/summary', async (req, res) => {
  const data = await organizationService.getCenterSummary();
  res.json({ ok: true, data });
});

router.get('/dashboard', async (req, res) => {
  const data = await salesService.getDashboardStats();
  res.json({ ok: true, data });
});

router.get('/security-stock', (req, res) => {
  const { monthlyGoal, daysCount } = req.query;
  res.json({
    ok: true,
    data: {
      monthlyGoal: Number(monthlyGoal || 0),
      daysCount: Number(daysCount || 31),
      value: calculateSecurityStock(monthlyGoal || 0, daysCount || 31)
    }
  });
});

module.exports = router;
