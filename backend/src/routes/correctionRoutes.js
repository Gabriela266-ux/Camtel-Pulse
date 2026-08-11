const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const correctionService = require('../services/correctionService');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const data = await correctionService.listByUser(req.user.email);
  res.json({ ok: true, data });
});

router.post('/', async (req, res, next) => {
  try {
    const payload = await correctionService.create({
      userEmail: req.user.email,
      ...req.body
    });

    res.status(201).json({ ok: true, data: payload });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/validate', async (req, res, next) => {
  try {
    const data = await correctionService.validate(req.params.id, req.user.email);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
