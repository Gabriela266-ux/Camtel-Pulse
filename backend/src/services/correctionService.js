const db = require('../models');

class CorrectionService {
  async listByUser(utilisateurId) {
    if (db.Correction) return db.Correction.findAll({ where: { utilisateur_id: utilisateurId }, order: [['created_at', 'DESC']] });
    return db.VenteDsmAuPos.findAll({ where: { utilisateur_id: utilisateurId } });
  }

  async create({ utilisateur_id, pos_id, date_vente, ancienne_valeur, nouvelle_valeur, motif }) {
    if (!utilisateur_id || !pos_id || !date_vente || !motif) {
      throw new Error('utilisateur_id, pos_id, date_vente et motif sont obligatoires');
    }

    return db.Correction.create({ pos_id, utilisateur_id, date_vente, ancienne_valeur: Number(ancienne_valeur || 0), nouvelle_valeur: Number(nouvelle_valeur || 0), motif });
  }

  async validate(venteId, utilisateur_id) {
    const correction = await db.Correction.findByPk(venteId);
    if (!correction) {
      throw new Error('Vente introuvable');
    }

    await correction.update({ statut: 'validee', valide_par: utilisateur_id, valide_le: new Date() });
    if (correction.vente_id) {
      await db.VenteDsmAuPos.update({ montant: correction.nouvelle_valeur, quantite_vendu: correction.nouvelle_valeur }, { where: { id: correction.vente_id } });
    }
    return correction;
  }
}

module.exports = new CorrectionService();