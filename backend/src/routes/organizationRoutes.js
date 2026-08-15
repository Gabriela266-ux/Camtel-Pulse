const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { centers, clients, dsms, pos } = require('../data/seedData');

const router = express.Router();

router.use(authenticate);

router.get('/centers', (req, res) => {
  res.json({ ok: true, data: centers });
});

router.get('/clients', (req, res) => {
  res.json({ ok: true, data: clients });
});

router.get('/dsms', (req, res) => {
  res.json({ ok: true, data: dsms });
});

router.get('/pos', (req, res) => {
  res.json({ ok: true, data: pos });
});

module.exports = router;
