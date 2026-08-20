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

    return db.VenteDsmAuPos.create({
      dsm_id: record.dsm_id,
      pos_id: record.id_pos,
      utilisateur_id: payload.utilisateur_id || null,
      date_vente: record.date,
      quantite_vendu: record.vente_jour,
      montant: record.vente_jour
    });
  }

  async listByEntity(posId = null) {
    const query = posId ? { pos_id: posId } : {};

    return db.VenteDsmAuPos.findAll({
      where: query,
      include: [{ model: db.Pos, as: 'pos' }]
    });
  }
}

module.exports = { SaisieService, calculateSecurityStock };
