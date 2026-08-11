const { clients, dsms, pos } = require('../data/seedData');

class ObjectifService {
  listByType(type, parentId = null) {
    if (type === 'client') {
      return parentId ? clients.filter((item) => item.centerId === parentId) : clients;
    }

    if (type === 'dsm') {
      return parentId ? dsms.filter((item) => item.clientId === parentId) : dsms;
    }

    if (type === 'pos') {
      return parentId ? pos.filter((item) => item.dsmId === parentId) : pos;
    }

    return [];
  }

  update(type, id, payload) {
    const items = this.listByType(type);
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error('Objectif introuvable');
    }

    const item = items[index];
    const updated = {
      ...item,
      ...payload,
      monthlyGoal: Number(payload.monthlyGoal ?? item.monthlyGoal ?? 0)
    };

    items[index] = updated;

    if (type === 'client') {
      const target = clients.findIndex((client) => client.id === id);
      if (target !== -1) { clients[target] = updated; }
    }

    if (type === 'dsm') {
      const target = dsms.findIndex((dsm) => dsm.id === id);
      if (target !== -1) { dsms[target] = updated; }
    }

    if (type === 'pos') {
      const target = pos.findIndex((point) => point.id === id);
      if (target !== -1) { pos[target] = updated; }
    }

    return updated;
  }
}

module.exports = new ObjectifService();
