const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { SaisieService } = require('../services/saisieService');

const router = express.Router();
const service = new SaisieService();

router.use(authenticate);

router.post('/', (req, res, next) => {
  try {
    const { id_pos, date, vente_jour } = req.body || {};

    if (!id_pos || !date || vente_jour === undefined) {
      return res.status(400).json({
        ok: false,
        message: 'id_pos, date et vente_jour sont obligatoires'
      });
    }

    const payload = service.create({ id_pos, date, vente_jour });
    return res.status(201).json({ ok: true, data: payload });
  } catch (error) {
    return next(error);
  }
});

router.get('/', (req, res) => {
  const { entite } = req.query;
  const data = service.listByEntity(entite || null);

  return res.json({ ok: true, data });
});

module.exports = router;
