const { pos, dsms, salesRecords } = require('../data/seedData');

class AlertesService {
  evaluatePos(posId) {
    const currentPos = pos.find((item) => item.id === posId);
    if (!currentPos) {
      return { statut: 'NORMAL', seuil: 0, valeur: 0, message: 'POS introuvable' };
    }

    const threshold = (Number(currentPos.monthlyGoal || 0) / 31) * 3;
    const realized = salesRecords
      .filter((record) => record.posId === posId)
      .reduce((sum, record) => sum + Number(record.realization || 0), 0);

    return {
      entityType: 'pos',
      entityId: posId,
      seuil: threshold,
      valeur: realized,
      statut: realized < threshold ? 'CRITIQUE' : 'NORMAL',
      message: realized < threshold ? 'Sous le seuil de sécurité' : 'Dans la zone de sécurité acceptable'
    };
  }

  evaluateDsm(dsmId) {
    const currentDsm = dsms.find((item) => item.id === dsmId);
    if (!currentDsm) {
      return { statut: 'NORMAL', seuil: 0, valeur: 0, message: 'DSM introuvable' };
    }

    const dsmPos = pos.filter((item) => item.dsmId === dsmId);
    const statuses = dsmPos.map((item) => this.evaluatePos(item.id));
    const isCritical = statuses.some((item) => item.statut === 'CRITIQUE');

    return {
      entityType: 'dsm',
      entityId: dsmId,
      seuil: Number(currentDsm.monthlyGoal || 0) / 31 * 3,
      valeur: dsmPos.reduce((sum, item) => sum + Number(item.monthlyGoal || 0), 0),
      statut: isCritical ? 'CRITIQUE' : 'NORMAL',
      message: isCritical ? 'Au moins un POS est sous seuil' : 'Aucun POS n’est sous seuil'
    };
  }
}

module.exports = new AlertesService();
