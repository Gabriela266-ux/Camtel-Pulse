const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const previsionService = require('../services/previsionService');
const { assertEntityAccess } = require('../utils/entityAccess');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { pos_id, year, month } = req.query;
    await assertEntityAccess(req.user, 'POS', pos_id);
    res.json({ ok: true, data: await previsionService.list(pos_id, year, month) });
  } catch (error) { next(error); }
});

router.post('/', authorize('chef_operationnel', 'operationnel'), async (req, res, next) => {
  try {
    await assertEntityAccess(req.user, 'POS', req.body && req.body.pos_id);
    const data = await previsionService.saveMany(req.body || {});
    res.status(201).json({ ok: true, data });
  } catch (error) { next(error); }
});

module.exports = router;
