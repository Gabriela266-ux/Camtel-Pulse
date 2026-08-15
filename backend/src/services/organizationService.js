const { centers, clients, dsms, pos } = require('../data/seedData');
const { buildOrganizationTree } = require('../utils/business');

class OrganizationService {
  async getTree() {
    return buildOrganizationTree();
  }

  async getCenterSummary() {
    return centers.map((center) => {
      const centerClients = clients.filter((client) => client.centerId === center.id);
      const totalMonthlyGoal = centerClients.reduce((sum, client) => sum + Number(client.monthlyGoal || 0), 0);

      return {
        ...center,
        totalMonthlyGoal,
        clientCount: centerClients.length,
        dsmCount: dsms.filter((dsm) => centerClients.some((client) => client.id === dsm.clientId)).length,
        posCount: pos.filter((p) => {
          const dsm = dsms.find((item) => item.id === p.dsmId);
          return dsm ? centerClients.some((client) => client.id === dsm.clientId) : false;
        }).length
      };
    });
  }
}

module.exports = new OrganizationService();
