const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const calendrierAchatService = require('../services/calendrierAchatService');

const router = express.Router();
router.use(authenticate);

// POST /api/calendrier-achat  { id_pos, dsm_id?, forecasts: { 'YYYY-MM-DD': quantite } }
router.post('/', async (req, res, next) => {
  try {
    const { id_pos, dsm_id, forecasts } = req.body || {};

    if (!id_pos || !forecasts || typeof forecasts !== 'object') {
      return res.status(400).json({ ok: false, message: 'id_pos et forecasts sont obligatoires' });
    }

    await calendrierAchatService.saveBulk({ id_pos, dsm_id, forecasts, utilisateur_id: req.user.id });
    return res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/calendrier-achat?id_pos=...&year=2026&month=8
router.get('/', async (req, res, next) => {
  try {
    const { id_pos, year, month } = req.query;

    if (!id_pos || !year || !month) {
      return res.status(400).json({ ok: false, message: 'id_pos, year et month sont obligatoires' });
    }

    const data = await calendrierAchatService.getForMonth(id_pos, Number(year), Number(month));
    return res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
