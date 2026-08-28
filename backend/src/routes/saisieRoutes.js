const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { SaisieService } = require('../services/saisieService');
const auditService = require('../services/auditService');

const router = express.Router();
const service = new SaisieService();

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const { entity_type, entity_id, date, vente_jour, stock_journalier } = req.body || {};

    if (!entity_type || !entity_id || !date || vente_jour === undefined) {
      return res.status(400).json({
        ok: false,
        message: 'entity_type, entity_id, date et vente_jour sont obligatoires'
      });
    }

    if (!['DA', 'DSM', 'POS'].includes(entity_type)) {
      return res.status(400).json({
        ok: false,
        message: 'entity_type doit être DA, DSM ou POS'
      });
    }

    const vente = Number(vente_jour);
    const stock = stock_journalier === undefined || stock_journalier === null ? undefined : Number(stock_journalier);
    if (!Number.isFinite(vente) || vente < 0 || (stock !== undefined && (!Number.isFinite(stock) || stock < 0))) {
      return res.status(400).json({ ok: false, message: 'Les valeurs saisies doivent être des nombres positifs ou nuls' });
    }

    const record = await service.buildRecord({ entity_type, entity_id, date, vente_jour: vente });
    await service.create({ entity_type, entity_id, date, vente_jour: vente, stock_journalier: stock, utilisateur_id: req.user.id });
    await auditService.add({ utilisateur_id: req.user.id, action: 'saisie_creee', entite: entity_type.toLowerCase(), entite_id: entity_id, details: { date, vente_jour, stock_journalier } });
    return res.status(201).json({ ok: true, data: { ...record, stock_journalier: stock ?? null } });
  } catch (error) {
    console.error('[SAISIE ROUTE] Error:', error.message, error.stack);
    return next(error);
  }
});

router.get('/', async (req, res) => {
  const { entite } = req.query;
  const data = await service.listByEntity(entite || null);

  return res.json({ ok: true, data });
});

router.delete('/', async(req, res, next) => {
  try {
    const entityType = String(req.query.entity_type || '').toUpperCase();
    const entityId = String(req.query.entity_id || '').trim();
    const month = String(req.query.month || '').trim();
    if (!['DA', 'DSM', 'POS'].includes(entityType) || !entityId || ['undefined', 'null'].includes(entityId.toLowerCase())) {
      return res.status(400).json({ ok: false, message: 'Entité invalide' });
    }
    const deleted = await service.clearEntityPeriod(entityType, entityId, month);
    await auditService.add({ utilisateur_id: req.user.id, action: 'suivi_journalier_vide', entite: entityType.toLowerCase(), entite_id: entityId, details: { month, deleted } });
    return res.json({ ok: true, data: { deleted } });
  } catch (error) { return next(error); }
});

module.exports = router;
