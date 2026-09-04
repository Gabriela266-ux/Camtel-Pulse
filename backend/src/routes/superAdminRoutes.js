'use strict';

const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const superAdminService = require('../services/superAdminService');
const accountService = require('../services/accountService');
const auditService = require('../services/auditService');

const router = express.Router();
router.use(authenticate, authorize('super_admin'));

router.get('/overview', async (req, res, next) => {
  try { return res.json({ ok: true, data: await superAdminService.overview() }); } catch (error) { return next(error); }
});

router.get('/centres', async (req, res, next) => {
  try { return res.json({ ok: true, data: await superAdminService.listCentres() }); } catch (error) { return next(error); }
});

router.post('/centres', async (req, res, next) => {
  try { return res.status(201).json({ ok: true, data: await superAdminService.createCentre(req.body || {}, req.user) }); } catch (error) { return next(error); }
});

router.patch('/centres/:id', async (req, res, next) => {
  try { return res.json({ ok: true, data: await superAdminService.updateCentre(req.params.id, req.body || {}, req.user) }); } catch (error) { return next(error); }
});

router.patch('/centres/:id/status', async (req, res, next) => {
  try { return res.json({ ok: true, data: await superAdminService.setCentreStatus(req.params.id, req.body && req.body.active, req.user) }); } catch (error) { return next(error); }
});

router.delete('/centres/:id', async (req, res, next) => {
  try { return res.json({ ok: true, data: await superAdminService.deleteCentre(req.params.id) }); } catch (error) { return next(error); }
});

router.get('/admins', async (req, res, next) => {
  try { return res.json({ ok: true, data: await superAdminService.listAdmins() }); } catch (error) { return next(error); }
});

router.post('/admins', async (req, res, next) => {
  try { return res.status(201).json({ ok: true, data: await superAdminService.createAdmin(req.body || {}, req.user) }); } catch (error) { return next(error); }
});

router.patch('/admins/:id/status', async (req, res, next) => {
  try { return res.json({ ok: true, data: await superAdminService.setAdminStatus(req.params.id, req.body && req.body.statut, req.user) }); } catch (error) { return next(error); }
});

router.patch('/admins/:id/reset-password', async (req, res, next) => {
  try { return res.json({ ok: true, data: await superAdminService.resetAdminPassword(req.params.id, req.user) }); } catch (error) { return next(error); }
});

router.get('/demandes', async (req, res, next) => {
  try { return res.json({ ok: true, data: await accountService.listAllDemandes(req.user) }); } catch (error) { return next(error); }
});

router.get('/audit', async (req, res, next) => {
  try { return res.json({ ok: true, data: await auditService.listForModifications(req.user) }); } catch (error) { return next(error); }
});

router.get('/centres/:id', async (req, res, next) => {
  try { return res.json({ ok: true, data: await superAdminService.getCentre(req.params.id) }); } catch (error) { return next(error); }
});

module.exports = router;
