const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const objectifService = require('../services/objectifService');

const router = express.Router();

router.use(authenticate);

router.get('/:type', (req, res) => {
  const { type } = req.params;
  const { parentId } = req.query;
  const data = objectifService.listByType(type, parentId || null);
  res.json({ ok: true, data });
});

router.patch('/:type/:id', (req, res, next) => {
  try {
    const { type, id } = req.params;
    const data = objectifService.update(type, id, req.body);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
