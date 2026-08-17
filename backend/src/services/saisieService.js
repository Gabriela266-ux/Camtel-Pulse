const db = require('../models');

const calculateSecurityStock = (objectifMensuel, daysCount = 31) => {
  if (!objectifMensuel || Number(objectifMensuel) <= 0) return 0;
  return (Number(objectifMensuel) / Number(daysCount || 31)) * 3;
};

class SaisieService {
  async getEntityById(idPos) {
    return await db.Pos.findByPk(idPos);
  }

  async buildRecord(payload) {
    const entity = await this.getEntityById(payload.id_pos);
    if (!entity) {
      throw new Error('Entité POS inconnue');
    }

    const date = payload.date || new Date().toISOString().slice(0, 10);
    const venteJour = Number(payload.vente_jour || 0);
    const stockSecurite = calculateSecurityStock(entity.objectif_mensuel, 31);
    const historique = await db.VenteDsmAuPos.findAll({
      where: { 
        pos_id: payload.id_pos,
        date_vente: { [db.Sequelize.Op.lte]: date }
      }
    });
    const ecartJour = venteJour - stockSecurite;
    const ecartCumule = historique.reduce((sum, item) => sum + (Number(item.montant || 0) - calculateSecurityStock(entity.objectif_mensuel, 31)), 0) + ecartJour;

    return {
      id_pos: payload.id_pos,
      date,
      vente_jour: venteJour,
      objectif_mensuel: entity.objectif_mensuel,
      stock_securite: stockSecurite,
      ecart_jour: ecartJour,
      ecart_cumule: ecartCumule,
      created_at: new Date().toISOString()
    };
  }

  async create(payload) {
    const record = await this.buildRecord(payload);
    
    return await db.VenteDsmAuPos.create({
      pos_id: record.id_pos,
      utilisateur_id: payload.utilisateur_id,
      date_vente: record.date,
      quantite_vendu: record.vente_jour,
      montant: record.vente_jour
    });
  }

  async listByEntity(posId = null) {
    const query = posId ? { pos_id: posId } : {};
    
    return await db.VenteDsmAuPos.findAll({
      where: query,
      include: [{ model: db.Pos, as: 'pos' }]
    });
  }
}

module.exports = { SaisieService, calculateSecurityStock };