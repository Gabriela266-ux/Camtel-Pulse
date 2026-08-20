const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const objectifService = require('../services/objectifService');

const router = express.Router();

router.use(authenticate);

router.get('/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const { parentId } = req.query;
    const data = await objectifService.listByType(type, parentId || null);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.patch('/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const data = await objectifService.update(type, id, req.body);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;