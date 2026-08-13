const db = require('../models');

class ObjectifService {
  async listByType(type, parentId = null) {
    if (type === 'centre') {
      return await db.Centre.findAll();
    }

    if (type === 'da') {
      return parentId 
        ? await db.Da.findAll({ where: { centre_id: parentId } })
        : await db.Da.findAll();
    }

    if (type === 'dsm') {
      return parentId 
        ? await db.Dsm.findAll({ where: { da_id: parentId } })
        : await db.Dsm.findAll();
    }

    if (type === 'pos') {
      return parentId 
        ? await db.Pos.findAll({ where: { dsm_id: parentId } })
        : await db.Pos.findAll();
    }

    return [];
  }

  async update(type, id, payload) {
    let model;
    let whereClause = { id };

    if (type === 'centre') {
      model = db.Centre;
    } else if (type === 'da') {
      model = db.Da;
    } else if (type === 'dsm') {
      model = db.Dsm;
    } else if (type === 'pos') {
      model = db.Pos;
    } else {
      throw new Error('Type introuvable');
    }

    const item = await model.findByPk(id);
    if (!item) {
      throw new Error('Objectif introuvable');
    }

    return await item.update({
      ...payload,
      objectif_mensuel: Number(payload.objectif_mensuel ?? item.objectif_mensuel ?? 0)
    });
  }
}

module.exports = new ObjectifService();