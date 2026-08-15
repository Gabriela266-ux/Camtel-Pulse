const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const accountService = require('../services/accountService');

const router = express.Router();

router.post('/request', async (req, res, next) => {
  try {
    const data = await accountService.requestAccount(req.body || {});
    res.status(201).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/pending', authenticate, async (req, res) => {
  const data = await accountService.listPendingAccounts();
  res.json({ ok: true, data });
});

router.patch('/:id/approve', authenticate, async (req, res, next) => {
  try {
    const data = await accountService.approveAccount(req.params.id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
