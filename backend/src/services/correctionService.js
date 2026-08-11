const { salesRecords } = require('../data/seedData');

class CorrectionService {
  async listByUser(userEmail) {
    return salesRecords
      .filter((record) => record.userEmail === userEmail)
      .map((record) => ({
        id: record.id,
        id_pos: record.posId,
        date: record.day,
        vente_jour: record.realization || record.vente_jour || 0,
        status: 'pending'
      }));
  }

  async create({ userEmail, id_pos, date, ancienne_valeur, nouvelle_valeur, motif }) {
    if (!userEmail || !id_pos || !date || !motif) {
      throw new Error('userEmail, id_pos, date et motif sont obligatoires');
    }

    const correction = {
      id: `correction-${Date.now()}`,
      userEmail,
      id_pos,
      date,
      ancienne_valeur: Number(ancienne_valeur || 0),
      nouvelle_valeur: Number(nouvelle_valeur || 0),
      motif,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    return correction;
  }

  async validate(correctionId, validatedBy) {
    if (!correctionId || !validatedBy) {
      throw new Error('correctionId et validatedBy sont obligatoires');
    }

    return {
      id: correctionId,
      status: 'approved',
      validatedBy,
      validated_at: new Date().toISOString()
    };
  }
}

module.exports = new CorrectionService();
