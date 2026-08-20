const db = require('../models');

class PrevisionService {
  async saveMany({ pos_id, da_id, dsm_id, year, month, forecasts }) {
    if (!pos_id || !year || !month || !forecasts || typeof forecasts !== 'object') {
      throw new Error('pos_id, year, month et forecasts sont obligatoires');
    }
    const entries = Object.entries(forecasts);
    const saved = [];
    for (const [date, value] of entries) {
      const [day, parsedMonth, parsedYear] = date.includes('/')
        ? date.split('/').map(Number)
        : date.split('-').map(Number).reverse();
      const datePrevision = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const [record] = await db.PrevisionJournaliere.findOrCreate({
        where: { pos_id, date_prevision: datePrevision },
        defaults: { da_id: da_id || null, dsm_id: dsm_id || null, montant_prevision: Number(value || 0) }
      });
      if (record.montant_prevision !== Number(value || 0)) {
        await record.update({ da_id: da_id || record.da_id, dsm_id: dsm_id || record.dsm_id, montant_prevision: Number(value || 0) });
      }
      saved.push(record);
    }
    return saved;
  }

  async list(posId, year, month) {
    const where = { pos_id: posId };
    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      where.date_prevision = { [db.Sequelize.Op.like]: `${prefix}%` };
    }
    return db.PrevisionJournaliere.findAll({ where, order: [['date_prevision', 'ASC']] });
  }
}

module.exports = new PrevisionService();
