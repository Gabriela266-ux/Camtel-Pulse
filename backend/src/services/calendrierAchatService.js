const db = require('../models');

class CalendrierAchatService {
  // forecasts : { 'YYYY-MM-DD': quantite, ... } — une ligne par jour, upsert.
  async saveBulk({ id_pos, dsm_id, forecasts, utilisateur_id }) {
    const pos = await db.Pos.findByPk(id_pos);
    if (!pos) throw new Error('POS introuvable');

    const dates = Object.keys(forecasts || {});
    const results = [];

    for (const date of dates) {
      const quantite = Number(forecasts[date] || 0);
      const [row] = await db.CalendrierAchat.findOrCreate({
        where: { pos_id: id_pos, date_prevue: date },
        defaults: {
          dsm_id: dsm_id || pos.dsm_id,
          utilisateur_id: utilisateur_id || null,
          quantite_prevue: quantite
        }
      });
      await row.update({ quantite_prevue: quantite, utilisateur_id: utilisateur_id || row.utilisateur_id });
      results.push(row);
    }

    return results;
  }

  async getForMonth(id_pos, year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const rows = await db.CalendrierAchat.findAll({
      where: { pos_id: id_pos, date_prevue: { [db.Sequelize.Op.between]: [startDate, endDate] } },
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
