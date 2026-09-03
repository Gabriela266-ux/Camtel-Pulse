const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const correctionService = require('../services/correctionService');
const { authorize } = require('../middlewares/authMiddleware');
const db = require('../models');
const { assertEntityAccess } = require('../utils/entityAccess');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const data = await correctionService.listByUser(req.user.id);
  res.json({ ok: true, data });
});

router.post('/', authorize('chef_operationnel', 'operationnel'), async (req, res, next) => {
  try {
    await assertEntityAccess(req.user, 'POS', req.body && req.body.pos_id);
    const payload = await correctionService.create({
      utilisateur_id: req.user.id,
      ...req.body
    });

    res.status(201).json({ ok: true, data: payload });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/validate', authorize('chef_operationnel'), async (req, res, next) => {
  try {
    const correction = await db.Correction.findByPk(req.params.id);
    if (!correction) return res.status(404).json({ ok: false, message: 'Correction introuvable' });
    await assertEntityAccess(req.user, 'POS', correction.pos_id);
    const data = await correctionService.validate(req.params.id, req.user.id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
