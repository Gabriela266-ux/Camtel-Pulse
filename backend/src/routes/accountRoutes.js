const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const accountService = require('../services/accountService');

const router = express.Router();

router.post('/request', async(req, res, next) => {
    try {
        const data = await accountService.requestAccount(req.body || {});
        res.status(201).json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users', async(req, res, next) => {
    try {
        const data = await accountService.listUsers();
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.get('/pending', async(req, res, next) => {
    try {
        const data = await accountService.listPendingAccounts();
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async(req, res, next) => {
    try {
        const data = await accountService.updateUser(req.params.id, req.body || {});
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/approve', async(req, res, next) => {
    try {
        const data = await accountService.approveAccount(req.params.id);
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/reject', async(req, res, next) => {
    try {
        const data = await accountService.rejectAccount(req.params.id);
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

module.exports = router;