const { salesRecords, pos } = require('../data/seedData');

const calculateSecurityStock = (objectifMensuel, daysCount = 31) => {
  if (!objectifMensuel || Number(objectifMensuel) <= 0) return 0;
  return (Number(objectifMensuel) / Number(daysCount || 31)) * 3;
};

class SaisieService {
  getEntityById(idPos) {
    return pos.find((item) => item.id === idPos);
  }

  buildRecord(payload) {
    const entity = this.getEntityById(payload.id_pos);
    if (!entity) {
      throw new Error('Entité POS inconnue');
    }

    const date = payload.date || new Date().toISOString().slice(0, 10);
    const venteJour = Number(payload.vente_jour || 0);
    const stockSecurite = calculateSecurityStock(entity.monthlyGoal, 31);
    const historique = salesRecords.filter((item) => item.posId === payload.id_pos && item.day <= date);
    const ecartJour = venteJour - stockSecurite;
    const ecartCumule = historique.reduce((sum, item) => sum + (Number(item.realization || item.vente_jour || 0) - calculateSecurityStock(entity.monthlyGoal, 31)), 0) + ecartJour;

    return {
      id: `saisie-${Date.now()}`,
      id_pos: payload.id_pos,
      date,
      vente_jour: venteJour,
      objectif_mensuel: entity.monthlyGoal,
      stock_securite: stockSecurite,
      ecart_jour: ecartJour,
      ecart_cumule: ecartCumule,
      created_at: new Date().toISOString()
    };
  }

  create(payload) {
    const record = this.buildRecord(payload);
    salesRecords.push({
      id: record.id,
      posId: record.id_pos,
      day: record.date,
      forecast: 0,
      realization: record.vente_jour,
      followUp: record.stock_securite,
      ...record
    });
    return record;
  }

  listByEntity(entite) {
    if (!entite) {
      return salesRecords.map((item) => ({
        id_pos: item.posId,
        date: item.day,
        vente_jour: item.realization || item.vente_jour || 0,
        stock_securite: calculateSecurityStock(
          pos.find((p) => p.id === item.posId)?.monthlyGoal || 0,
          31
        ),
        ecart_jour: (item.realization || item.vente_jour || 0) - calculateSecurityStock(
          pos.find((p) => p.id === item.posId)?.monthlyGoal || 0,
          31
        ),
        ecart_cumule: (item.realization || item.vente_jour || 0) - calculateSecurityStock(
          pos.find((p) => p.id === item.posId)?.monthlyGoal || 0,
          31
        )
      }));
    }

    return salesRecords
      .filter((item) => item.posId === entite)
      .map((item) => ({
        id_pos: item.posId,
        date: item.day,
        vente_jour: item.realization || item.vente_jour || 0,
        stock_securite: calculateSecurityStock(
          pos.find((p) => p.id === item.posId)?.monthlyGoal || 0,
          31
        ),
        ecart_jour: (item.realization || item.vente_jour || 0) - calculateSecurityStock(
          pos.find((p) => p.id === item.posId)?.monthlyGoal || 0,
          31
        ),
        ecart_cumule: (item.realization || item.vente_jour || 0) - calculateSecurityStock(
          pos.find((p) => p.id === item.posId)?.monthlyGoal || 0,
          31
        )
      }));
  }
}

module.exports = { SaisieService, calculateSecurityStock };
