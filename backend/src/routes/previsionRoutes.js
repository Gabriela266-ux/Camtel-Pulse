const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const previsionService = require('../services/previsionService');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { pos_id, year, month } = req.query;
    res.json({ ok: true, data: await previsionService.list(pos_id, year, month) });
  } catch (error) { next(error); }
});

router.post('/', authorize('admin', 'chef_operationnel', 'operationnel'), async (req, res, next) => {
  try {
    const data = await previsionService.saveMany(req.body || {});
    res.status(201).json({ ok: true, data });
  } catch (error) { next(error); }
});

module.exports = router;
