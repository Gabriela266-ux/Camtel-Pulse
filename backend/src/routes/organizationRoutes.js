const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const db = require('../models');

const router = express.Router();

router.use(authenticate);

router.get('/centers', async (req, res) => {
  try {
    const centers = await db.Centre.findAll();
    res.json({ ok: true, data: centers });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const clients = await db.Da.findAll();
    res.json({ ok: true, data: clients });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get('/dsms', async (req, res) => {
  try {
    const dsms = await db.Dsm.findAll({
      include: [{ model: db.Da, as: 'da' }]
    });
    res.json({ ok: true, data: dsms });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get('/pos', async (req, res) => {
  try {
    const pos = await db.Pos.findAll({
      include: [{ model: db.Dsm, as: 'dsm' }]
    });
    res.json({ ok: true, data: pos });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
