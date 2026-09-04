const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const db = require('../models');
const { assertEntityAccess } = require('../utils/entityAccess');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', async (req, res) => {
  try {
    const ventes = await db.VenteDsmAuPos.findAll({
      include: [{ model: db.Dsm, as: 'dsm', required: true, include: [{ model: db.Da, as: 'da', required: true, where: req.user.role === 'super_admin' ? {} : { centre_id: req.user.centerId } }] }]
    });
    const totalRealization = ventes.reduce((sum, v) => sum + Number(v.montant || 0), 0);
    const posCount = await db.Pos.count({ include: [{ model: db.Dsm, as: 'dsm', required: true, include: [{ model: db.Da, as: 'da', required: true, where: req.user.role === 'super_admin' ? {} : { centre_id: req.user.centerId } }] }] });
    
    res.json({
      ok: true,
      data: {
        totalRealization,
        posCount,
        recordsCount: ventes.length,
        currentRole: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get('/records', async (req, res) => {
  try {
    const records = await db.VenteDsmAuPos.findAll({
      include: [
        { model: db.Dsm, as: 'dsm', required: true, include: [{ model: db.Da, as: 'da', required: true, where: req.user.role === 'super_admin' ? {} : { centre_id: req.user.centerId } }] },
        { model: db.Pos, as: 'pos' },
        { model: db.Utilisateur, as: 'saisi_par' }
      ]
    });
    res.json({ ok: true, data: records });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.post('/records', async (req, res) => {
  const { pos_id, date_vente, quantite_vendu, montant } = req.body;

  try {
    await assertEntityAccess(req.user, 'POS', pos_id);
    const pos = await db.Pos.findByPk(pos_id);
    if (!pos) {
      return res.status(404).json({ ok: false, message: 'POS introuvable' });
    }

    const record = await db.VenteDsmAuPos.create({
      dsm_id: pos.dsm_id,
      pos_id,
      utilisateur_id: req.user.id,
      date_vente,
      quantite_vendu,
      montant
    });
    res.status(201).json({ ok: true, data: record });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});
module.exports = router;
