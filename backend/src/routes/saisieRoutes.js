const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const db = require('../models');
const { SaisieService } = require('../services/saisieService');
const auditService = require('../services/auditService');
const { assertEntityAccess } = require('../utils/entityAccess');
const redis = require('../config/redis');

const router = express.Router();
const service = new SaisieService();

router.use(authenticate);

router.post('/', authorize('chef_operationnel', 'operationnel'), async (req, res, next) => {
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
    await assertEntityAccess(req.user, entity_type, entity_id);

    const vente = Number(vente_jour);
    const stock = stock_journalier === undefined || stock_journalier === null ? undefined : Number(stock_journalier);
    if (!Number.isFinite(vente) || vente < 0 || (stock !== undefined && (!Number.isFinite(stock) || stock < 0))) {
      return res.status(400).json({ ok: false, message: 'Les valeurs saisies doivent être des nombres positifs ou nuls' });
    }

    const record = await service.buildRecord({ entity_type, entity_id, date, vente_jour: vente });
    const persisted = await service.create({ entity_type, entity_id, date, vente_jour: vente, stock_journalier: stock, utilisateur_id: req.user.id });
    await auditService.add({
      utilisateur_id: req.user.id,
      action: persisted.created ? 'saisie_creee' : 'saisie_modifiee',
      entite: entity_type.toLowerCase(),
      entite_id: entity_id,
      details: {
        date,
        entity_type,
        entity_id,
        valeurs: { achat: vente, stock_journalier: stock ?? null },
      },
    });
    await redis.publish('events', {
      type: stock === undefined ? 'sale_created' : 'stock_updated',
      payload: { entityType: entity_type, entityId: entity_id, date },
    });
    await redis.publish('events', {
      type: 'dashboard_updated',
      payload: { centreId: req.user.centerId, entityType: entity_type, entityId: entity_id, date },
    });
    return res.status(persisted.created ? 201 : 200).json({ ok: true, data: { ...record, stock_journalier: stock ?? null } });
  } catch (error) {
    console.error('[SAISIE ROUTE] Error:', error.message, error.stack);
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const entite = String(req.query.entite || '').trim();
    if (!entite) return res.status(400).json({ ok: false, message: 'Le paramètre entite est obligatoire' });
    let entityType = null;
    if (await db.Da.findByPk(entite, { attributes: ['id'] })) entityType = 'DA';
    else if (await db.Dsm.findByPk(entite, { attributes: ['id'] })) entityType = 'DSM';
    else if (await db.Pos.findByPk(entite, { attributes: ['id'] })) entityType = 'POS';
    if (!entityType) return res.status(404).json({ ok: false, message: 'Entité introuvable' });
    await assertEntityAccess(req.user, entityType, entite);
    const data = await service.listByEntity(entite);
    return res.json({ ok: true, data });
  } catch (error) { return next(error); }
});

router.delete('/', authorize('chef_operationnel', 'operationnel'), async(req, res, next) => {
  try {
    const entityType = String(req.query.entity_type || '').toUpperCase();
    const entityId = String(req.query.entity_id || '').trim();
    const month = String(req.query.month || '').trim();
    if (!['DA', 'DSM', 'POS'].includes(entityType) || !entityId || ['undefined', 'null'].includes(entityId.toLowerCase())) {
      return res.status(400).json({ ok: false, message: 'Entité invalide' });
    }
    await assertEntityAccess(req.user, entityType, entityId);
    const deleted = await service.clearEntityPeriod(entityType, entityId, month);
    await auditService.add({ utilisateur_id: req.user.id, action: 'suivi_journalier_vide', entite: entityType.toLowerCase(), entite_id: entityId, details: { month, deleted } });
    return res.json({ ok: true, data: { deleted } });
  } catch (error) { return next(error); }
});

module.exports = router;
