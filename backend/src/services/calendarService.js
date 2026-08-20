const db = require('../models');

class CalendarService {
  generateMonth({ entityType = 'pos', entityId, year = new Date().getFullYear(), month = new Date().getMonth() + 1, objective = 0 }) {
    const monthIndex = Number(month) - 1;
    const date = new Date(Number(year), monthIndex, 1);
    const daysInMonth = new Date(Number(year), Number(monthIndex) + 1, 0).getDate();
    const goal = Number(objective || 0);
    const baseThreshold = goal > 0 ? (goal / 31) * 3 : 0;

    const result = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateIso = new Date(Number(year), monthIndex, day).toISOString().slice(0, 10);
      result.push({
        entityType,
        entityId,
        date: dateIso,
        jour: day,
        objectif_jour: goal > 0 ? goal / daysInMonth : 0,
        stock_securite: baseThreshold,
        vente_jour: 0,
        ecart_jour: 0,
        ecart_cumule: 0,
        statut: 'NORMAL'
      });
    }

    return result;
  }

  async getCurrentMonthForEntity(entityId, entityType = 'pos') {
    let entity;
    if (entityType === 'dsm') {
      entity = await db.Dsm.findByPk(entityId);
    } else {
      entity = await db.Pos.findByPk(entityId);
    }

    const goal = entity ? Number(entity.objectif_mensuel || 0) : 0;
    return this.generateMonth({ entityType, entityId, objective: goal });
  }
}

module.exports = new CalendarService();