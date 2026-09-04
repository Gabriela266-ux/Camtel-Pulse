const db = require('../models');

async function resolvePartnerId(entityType, entityId) {
  const type = String(entityType || '').toUpperCase();
  const id = String(entityId || '').trim();
  if (!id) return null;
  if (type === 'DA') return id;
  if (type === 'DSM') {
    const dsm = await db.Dsm.findByPk(id, { attributes: ['da_id'] });
    return dsm ? String(dsm.da_id) : null;
  }
  if (type === 'POS') {
    const pos = await db.Pos.findByPk(id, {
      attributes: ['dsm_id'],
      include: [{ model: db.Dsm, as: 'dsm', attributes: ['da_id'] }],
    });
    return pos && pos.dsm ? String(pos.dsm.da_id) : null;
  }
  return null;
}

async function resolveCenterId(entityType, entityId) {
  const type = String(entityType || '').toUpperCase();
  const id = String(entityId || '').trim();
  if (!id) return null;
  if (type === 'CENTRE' || type === 'CENTER') {
    const centre = await db.Centre.findByPk(id, { attributes: ['id'] });
    return centre ? String(centre.id) : null;
  }
  const partnerId = await resolvePartnerId(type, id);
  if (!partnerId) return null;
  const partner = await db.Da.findByPk(partnerId, { attributes: ['centre_id'] });
  return partner ? String(partner.centre_id) : null;
}

async function assertEntityAccess(user, entityType, entityId) {
  if (!user) {
    const error = new Error('Authentification requise');
    error.statusCode = 401;
    throw error;
  }
  if (user.role === 'super_admin') return;
  const centerId = await resolveCenterId(entityType, entityId);
  if (!centerId) {
    const error = new Error('Entité introuvable');
    error.statusCode = 404;
    throw error;
  }
  if (!user.centerId || String(user.centerId) !== centerId) {
    const error = new Error("Cette entité n'appartient pas à votre centre");
    error.statusCode = 403;
    throw error;
  }
  if (user.role !== 'operationnel') return;
  const partnerId = await resolvePartnerId(entityType, entityId);
  if (!partnerId || !(user.partnerIds || []).includes(partnerId)) {
    const error = new Error("Cette entité ne fait pas partie de vos partenaires affectés");
    error.statusCode = 403;
    throw error;
  }
}

module.exports = { assertEntityAccess, resolvePartnerId, resolveCenterId };
