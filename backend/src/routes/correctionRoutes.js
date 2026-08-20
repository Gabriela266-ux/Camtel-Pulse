const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const correctionService = require('../services/correctionService');
const { authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const data = await correctionService.listByUser(req.user.id);
  res.json({ ok: true, data });
});

router.post('/', async (req, res, next) => {
  try {
    const payload = await correctionService.create({
      utilisateur_id: req.user.id,
      ...req.body
    });

    res.status(201).json({ ok: true, data: payload });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/validate', authorize('admin', 'chef_operationnel'), async (req, res, next) => {
  try {
    const data = await correctionService.validate(req.params.id, req.user.id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
