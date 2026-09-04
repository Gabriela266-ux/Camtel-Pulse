'use strict';

const express = require('express');
const superAdminService = require('../services/superAdminService');
const accountService = require('../services/accountService');

const router = express.Router();

router.get('/public', async (req, res, next) => {
  try {
    const data = await superAdminService.publicCentres();
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get('/public/:centreId/chefs-operationnels', async (req, res, next) => {
  try {
    const data = await accountService.listPublicChefs(req.params.centreId);
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
