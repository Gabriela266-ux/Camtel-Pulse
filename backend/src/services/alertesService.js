const db = require('../models');

class AlertesService {
  async evaluatePos(posId) {
    const currentPos = await db.Pos.findByPk(posId);
    if (!currentPos) {
      return { statut: 'NORMAL', seuil: 0, valeur: 0, message: 'POS introuvable' };
    }

    const threshold = (Number(currentPos.objectif_mensuel || 0) / 31) * 3;
    const ventes = await db.VenteDsmAuPos.findAll({
      where: { pos_id: posId }
    });
    const realized = ventes.reduce((sum, v) => sum + Number(v.montant || 0), 0);

    return {
      entityType: 'pos',
      entityId: posId,
      seuil: threshold,
      valeur: realized,
      statut: realized < threshold ? 'CRITIQUE' : 'NORMAL',
      message: realized < threshold ? 'Sous le seuil de sécurité' : 'Dans la zone de sécurité acceptable'
    };
  }

  async evaluateDsm(dsmId) {
    const currentDsm = await db.Dsm.findByPk(dsmId);
    if (!currentDsm) {
      return { statut: 'NORMAL', seuil: 0, valeur: 0, message: 'DSM introuvable' };
    }

    const dsmPos = await db.Pos.findAll({
      where: { dsm_id: dsmId }
    });
    
    const statuses = await Promise.all(dsmPos.map(p => this.evaluatePos(p.id)));
    const isCritical = statuses.some((item) => item.statut === 'CRITIQUE');

    return {
      entityType: 'dsm',
      entityId: dsmId,
      seuil: (Number(currentDsm.objectif_mensuel || 0) / 31) * 3,
      valeur: dsmPos.reduce((sum, item) => sum + Number(item.objectif_mensuel || 0), 0),
      statut: isCritical ? 'CRITIQUE' : 'NORMAL',
      message: isCritical ? 'Au moins un POS est sous seuil' : 'Aucun POS n\'est sous seuil'
    };
  }
}

module.exports = new AlertesService();