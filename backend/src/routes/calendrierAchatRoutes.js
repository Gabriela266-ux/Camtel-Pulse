const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const calendrierAchatService = require('../services/calendrierAchatService');

const router = express.Router();
router.use(authenticate);

// POST /api/calendrier-achat  { entity_type: 'DA'|'DSM'|'POS', entity_id, forecasts }
router.post('/', async (req, res, next) => {
  try {
    const { entity_type, entity_id, forecasts } = req.body || {};

    if (!entity_type || !entity_id || !forecasts || typeof forecasts !== 'object') {
      return res.status(400).json({ ok: false, message: 'entity_type, entity_id et forecasts sont obligatoires' });
    }

    const data = await calendrierAchatService.saveBulk({ entity_type, entity_id, forecasts, utilisateur_id: req.user.id });
    return res.status(201).json({
      ok: true,
      data: data.map((row) => ({
        id: String(row.id),
        entity_type: String(entity_type).toUpperCase(),
        entity_id: String(entity_id),
        date: row.date_prevue,
        montant: Number(row.quantite_prevue),
        volume: Number(row.quantite_prevue)
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/calendrier-achat?entity_type=DA&entity_id=...&year=2026&month=8
router.get('/', async (req, res, next) => {
  try {
    const { entity_type, entity_id, year, month } = req.query;

    if (!entity_type || !entity_id || !year || !month) {
      return res.status(400).json({ ok: false, message: 'entity_type, entity_id, year et month sont obligatoires' });
    }

    const data = await calendrierAchatService.getForMonth(entity_type, entity_id, Number(year), Number(month));
    return res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
