const db = require('../models');

class CalendrierAchatService {
  async resolveEntity(entityType, entityId) {
    const type = String(entityType || '').toUpperCase();
    const models = { DA: db.Da, DSM: db.Dsm, POS: db.Pos };
    if (!models[type]) throw new Error('Portée invalide (DA, DSM ou POS attendue)');
    const entity = await models[type].findByPk(entityId);
    if (!entity) throw new Error(`${type === 'DA' ? 'Partenaire' : type} introuvable`);
    return { type, entity };
  }

  scopeWhere(type, entity) {
    if (type === 'DA') return { da_id: entity.id, dsm_id: null, pos_id: null };
    if (type === 'DSM') return { da_id: null, dsm_id: entity.id, pos_id: null };
    return { pos_id: entity.id };
  }

  // forecasts : { 'YYYY-MM-DD': quantite, ... } — une ligne par jour, upsert.
  async saveBulk({ entity_type, entity_id, forecasts, utilisateur_id }) {
    const { type, entity } = await this.resolveEntity(entity_type, entity_id);
    const scope = this.scopeWhere(type, entity);

    const dates = Object.keys(forecasts || {});
    const results = [];

    for (const date of dates) {
      const quantite = Number(forecasts[date] || 0);
      const [row] = await db.CalendrierAchat.findOrCreate({
        where: { ...scope, date_prevue: date },
        defaults: {
          ...scope,
          utilisateur_id: utilisateur_id || null,
          quantite_prevue: quantite
        }
      });
      await row.update({ quantite_prevue: quantite, utilisateur_id: utilisateur_id || row.utilisateur_id });
      results.push(row);
    }

    return results;
  }

  async getForMonth(entityType, entityId, year, month) {
    const { type, entity } = await this.resolveEntity(entityType, entityId);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const rows = await db.CalendrierAchat.findAll({
      where: { ...this.scopeWhere(type, entity), date_prevue: { [db.Sequelize.Op.between]: [startDate, endDate] } },
      order: [['date_prevue', 'ASC']]
    });

    const result = {};
    rows.forEach((row) => {
      result[row.date_prevue] = Number(row.quantite_prevue);
    });
    return result;
  }
}

module.exports = new CalendrierAchatService();
