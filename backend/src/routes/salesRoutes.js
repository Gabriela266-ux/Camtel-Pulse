const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { salesRecords, pos } = require('../data/seedData');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', (req, res) => {
  const totalForecast = salesRecords.reduce((sum, record) => sum + Number(record.forecast || 0), 0);
  const totalRealization = salesRecords.reduce((sum, record) => sum + Number(record.realization || 0), 0);
  const totalFollowUp = salesRecords.reduce((sum, record) => sum + Number(record.followUp || 0), 0);

  res.json({
    ok: true,
    data: {
      totalForecast,
      totalRealization,
      totalFollowUp,
      averageCoverage: totalRealization > 0 ? (totalFollowUp / totalRealization) * 100 : 0,
      posCount: pos.length,
      recordsCount: salesRecords.length,
      currentRole: req.user.role
    }
  });
});

router.get('/records', (req, res) => {
  res.json({ ok: true, data: salesRecords });
});

router.post('/records', (req, res) => {
  const { posId, day, forecast, realization, followUp } = req.body || {};

  if (!posId || !day) {
    return res.status(400).json({ ok: false, message: 'posId et day sont obligatoires' });
  }

  const record = {
    id: `sale-${Date.now()}`,
    posId,
    day,
    forecast: Number(forecast || 0),
    realization: Number(realization || 0),
    followUp: Number(followUp || 0)
  };

  salesRecords.push(record);

  return res.status(201).json({ ok: true, data: record });
});

module.exports = router;
