const db = require('../models');

class SalesService {
  async getDashboardStats(centerId = null) {
    const ventes = await db.VenteDsmAuPos.findAll({
      include: centerId ? [{
        model: db.Dsm,
        as: 'dsm',
        required: true,
        include: [{ model: db.Da, as: 'da', required: true, where: { centre_id: centerId } }],
      }] : [],
    });
    const totalMontant = ventes.reduce((sum, v) => sum + Number(v.montant || 0), 0);
    
    return {
      totalMontant,
      totalQuantite: ventes.reduce((sum, v) => sum + Number(v.quantite_vendu || 0), 0),
      recordCount: ventes.length
    };
  }

  async listRecords() {
    return await db.VenteDsmAuPos.findAll({
      include: [
        { model: db.Dsm, as: 'dsm' },
        { model: db.Pos, as: 'pos' },
        { model: db.Utilisateur, as: 'saisi_par' }
      ]
    });
  }

  async createRecord(payload) {
    return await db.VenteDsmAuPos.create({
      pos_id: payload.pos_id,
      dsm_id: payload.dsm_id,
      utilisateur_id: payload.utilisateur_id,
      date_vente: payload.date_vente,
      quantite_vendu: Number(payload.quantite_vendu || 0),
      montant: Number(payload.montant || 0)
    });
  }
}

module.exports = new SalesService();
