const db = require('../models');

const calculateSecurityStock = (objectifMensuel, daysCount = 31) => {
  if (!objectifMensuel || Number(objectifMensuel) <= 0) return 0;
  return (Number(objectifMensuel) / Number(daysCount || 31)) * 3;
};

class SaisieService {
  async getPos(idPos) {
    const pos = await db.Pos.findByPk(idPos);
    if (!pos) {
      throw new Error('POS introuvable');
    }
    return pos;
  }

  async getObjectifMensuel(posId, date) {
    const d = new Date(date);
    const annee = d.getFullYear();
    const mois = d.getMonth() + 1;

    const objectif = await db.ObjectifMensuel.findOne({
      where: { pos_id: posId, annee, mois }
    });

    return Number(objectif?.montant_objectif || 0);
  }

  async buildRecord(payload) {
    const pos = await this.getPos(payload.id_pos);
    const date = payload.date || new Date().toISOString().slice(0, 10);
    const venteJour = Number(payload.vente_jour || 0);

    const objectifMensuel = await this.getObjectifMensuel(payload.id_pos, date);
    const stockSecurite = calculateSecurityStock(objectifMensuel, 31);

    const historique = await db.VenteDsmAuPos.findAll({
      where: {
        pos_id: payload.id_pos,
        date_vente: { [db.Sequelize.Op.lte]: date }
      }
    });

    const ecartJour = venteJour - stockSecurite;
    const ecartCumule =
      historique.reduce((sum, item) => sum + (Number(item.montant || 0) - stockSecurite), 0) + ecartJour;

    return {
      id_pos: payload.id_pos,
      dsm_id: pos.dsm_id,
      date,
      vente_jour: venteJour,
      objectif_mensuel: objectifMensuel,
      stock_securite: stockSecurite,
      ecart_jour: ecartJour,
      ecart_cumule: ecartCumule,
      created_at: new Date().toISOString()
    };
  }

  async create(payload) {
    const record = await this.buildRecord(payload);
    const vente = await db.VenteDsmAuPos.create({
      dsm_id: record.dsm_id,
      pos_id: record.id_pos,
      utilisateur_id: payload.utilisateur_id || null,
      date_vente: record.date,
      quantite_vendu: record.vente_jour,
      montant: record.vente_jour
    });

    // Le "Stock journalier (U)" saisi par l'opérationnel (EntryModal) est une valeur
    // distincte de la vente du jour — table `stock` (quantite_credit), une ligne par
    // POS et par jour. Upsert : une seule ligne par (pos_id, date_stock), pour éviter
    // les doublons si l'opérationnel corrige une saisie du même jour.
    if (payload.stock_journalier !== undefined && payload.stock_journalier !== null) {
      const [stockRow] = await db.Stock.findOrCreate({
        where: { pos_id: record.id_pos, date_stock: record.date },
        defaults: {
          dsm_id: record.dsm_id,
          utilisateur_id: payload.utilisateur_id || null,
          quantite_credit: Number(payload.stock_journalier)
        }
      });

      await stockRow.update({ quantite_credit: Number(payload.stock_journalier) });
    }

    // Trace complémentaire au niveau du DA (table achat_journaliere), utilisée pour
    // le reporting côté partenaire — n'entre pas en conflit avec le suivi par POS.
    const pos = await db.Pos.findByPk(record.id_pos, { include: [{ model: db.Dsm, as: 'dsm' }] });
    if (db.AchatJournaliere && pos?.dsm?.da_id) {
      await db.AchatJournaliere.create({
        da_id: pos.dsm.da_id,
        utilisateur_id: payload.utilisateur_id || null,
        date_achat: record.date,
        montant_achat: record.vente_jour
      });
    }

    return vente;
  }

  async listByEntity(posId = null) {
    const query = posId ? { pos_id: posId } : {};

    return db.VenteDsmAuPos.findAll({
      where: query,
      include: [{ model: db.Pos, as: 'pos' }]
    });
  }

  async listDailyRecords(posId) {
    const ventes = await db.VenteDsmAuPos.findAll({ where: { pos_id: posId }, order: [['date_vente', 'ASC']] });
    const stocks = await db.Stock.findAll({ where: { pos_id: posId }, order: [['date_stock', 'ASC']] });
    const forecasts = db.PrevisionJournaliere
      ? await db.PrevisionJournaliere.findAll({ where: { pos_id: posId }, order: [['date_prevision', 'ASC']] })
      : [];
    const byDate = new Map();
    for (const vente of ventes) byDate.set(vente.date_vente, { date: vente.date_vente, achat: Number(vente.montant || 0) });
    for (const stock of stocks) {
      const row = byDate.get(stock.date_stock) || { date: stock.date_stock, achat: 0 };
      row.stock_journalier = Number(stock.quantite_credit || 0);
      byDate.set(stock.date_stock, row);
    }
    for (const forecast of forecasts) {
      const row = byDate.get(forecast.date_prevision) || { date: forecast.date_prevision, achat: 0 };
      row.prevision_ca = Number(forecast.montant_prevision || 0);
      byDate.set(forecast.date_prevision, row);
    }
    let cumul = 0;
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).map((row) => {
      cumul += row.achat || 0;
      const stock = row.stock_journalier || 0;
      const ecart = stock - 0;
      return { date: row.date, prevision_ca: row.prevision_ca || 0, achat: row.achat || 0, stock_journalier: stock, cumul_achat: cumul, consommation: row.achat || 0, ecart_jour: ecart, ecart_cumule: ecart, statut: ecart >= 0 ? 'NORMAL' : 'CRITIQUE' };
    });
  }
}

module.exports = { SaisieService, calculateSecurityStock };