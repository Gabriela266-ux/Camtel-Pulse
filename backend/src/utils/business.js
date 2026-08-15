const { centers, clients, dsms, pos } = require('../data/seedData');

function calculateSecurityStock(monthlyGoal, daysCount = 31) {
  if (!Number.isFinite(Number(monthlyGoal)) || Number(monthlyGoal) <= 0) {
    return 0;
  }

  if (!Number.isFinite(Number(daysCount)) || Number(daysCount) <= 0) {
    return 0;
  }

  return (Number(monthlyGoal) / Number(daysCount)) * 3;
}

function buildOrganizationTree() {
  return centers.map((center) => ({
    ...center,
    clients: clients
      .filter((client) => client.centerId === center.id)
      .map((client) => ({
        ...client,
        dsms: dsms
          .filter((dsm) => dsm.clientId === client.id)
          .map((dsm) => ({
            ...dsm,
            pos: pos.filter((p) => p.dsmId === dsm.id)
          }))
      }))
  }));
}

module.exports = {
  calculateSecurityStock,
  buildOrganizationTree
};
