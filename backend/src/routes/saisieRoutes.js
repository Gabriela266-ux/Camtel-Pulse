const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { SaisieService } = require('../services/saisieService');

const router = express.Router();
const service = new SaisieService();

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const { id_pos, date, vente_jour } = req.body || {};

    if (!id_pos || !date || vente_jour === undefined) {
      return res.status(400).json({
        ok: false,
        message: 'id_pos, date et vente_jour sont obligatoires'
      });
    }

    const record = await service.buildRecord({ id_pos, date, vente_jour });
    await service.create({ id_pos, date, vente_jour, utilisateur_id: req.user.id });
    return res.status(201).json({ ok: true, data: record });
  } catch (error) {
    console.error('[SAISIE ROUTE] Error:', error.message, error.stack);
    return next(error);
  }
});

router.get('/', async (req, res) => {
  const { entite } = req.query;
  const data = await service.listByEntity(entite || null);

  return res.json({ ok: true, data });
});

module.exports = router;
