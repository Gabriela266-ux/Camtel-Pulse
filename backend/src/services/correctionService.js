const db = require('../models');

class CorrectionService {
  async listByUser(utilisateurId) {
    // À adapter selon votre structure - exemple avec VenteDsmAuPos
    return await db.VenteDsmAuPos.findAll({
      where: { utilisateur_id: utilisateurId }
    });
  }

  async create({ utilisateur_id, pos_id, date_vente, ancienne_valeur, nouvelle_valeur, motif }) {
    if (!utilisateur_id || !pos_id || !date_vente || !motif) {
      throw new Error('utilisateur_id, pos_id, date_vente et motif sont obligatoires');
    }

    // Créer ou mettre à jour le VenteDsmAuPos avec le motif de correction
    const vente = await db.VenteDsmAuPos.create({
      pos_id,
      utilisateur_id,
      date_vente,
      quantite_vendu: Number(nouvelle_valeur || 0),
      montant: Number(nouvelle_valeur || 0)
    });

    return {
      id: vente.id,
      pos_id,
      utilisateur_id,
      date_vente,
      ancienne_valeur: Number(ancienne_valeur || 0),
      nouvelle_valeur: Number(nouvelle_valeur || 0),
      motif,
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }

  async validate(venteId, utilisateur_id) {
    const vente = await db.VenteDsmAuPos.findByPk(venteId);
    if (!vente) {
      throw new Error('Vente introuvable');
    }

    return {
      id: vente.id,
      status: 'approved',
      validatedBy: utilisateur_id,
      validated_at: new Date().toISOString()
    };
  }
}

module.exports = new CorrectionService();