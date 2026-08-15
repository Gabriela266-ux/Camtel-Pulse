const { salesRecords } = require('../data/seedData');

class SalesService {
  async getDashboardStats() {
    const totalForecast = salesRecords.reduce((sum, record) => sum + Number(record.forecast || 0), 0);
    const totalRealization = salesRecords.reduce((sum, record) => sum + Number(record.realization || 0), 0);
    const totalFollowUp = salesRecords.reduce((sum, record) => sum + Number(record.followUp || 0), 0);

    return {
      totalForecast,
      totalRealization,
      totalFollowUp,
      averageCoverage: totalRealization > 0 ? (totalFollowUp / totalRealization) * 100 : 0,
      recordCount: salesRecords.length
    };
  }

  async listRecords() {
    return salesRecords;
  }

  async createRecord(payload) {
    const record = {
      id: `sale-${Date.now()}`,
      posId: payload.posId,
      day: payload.day,
      forecast: Number(payload.forecast || 0),
      realization: Number(payload.realization || 0),
      followUp: Number(payload.followUp || 0)
    };

    salesRecords.push(record);
    return record;
  }
}

module.exports = new SalesService();
