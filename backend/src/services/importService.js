const { clients, dsms, pos } = require('../data/seedData');

class ImportService {
  parseCsvContent(content) {
    const rows = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (rows.length < 2) {
      return [];
    }

    const headers = rows[0].split(';').map((header) => header.trim().toLowerCase());
    const records = rows.slice(1).map((line) => {
      const values = line.split(';').map((value) => value.trim());
      const item = {};

      headers.forEach((header, index) => {
        item[header] = values[index] ?? '';
      });

      return item;
    });

    return records;
  }

  importFromCsv(content) {
    const rows = this.parseCsvContent(content);

    const inserted = rows.map((row) => {
      const entity = {
        id: `import-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: row.nom || row.name || 'Importé',
        monthlyGoal: Number(row.objectif || row.objectif_mensuel || row.monthlygoal || 0),
        centerId: row.centre_id || row.centerid || 'center-1',
        clientId: row.client_id || row.clientid || null,
        dsmId: row.dsm_id || row.dsmid || null,
        source: 'csv-import'
      };

      if (!entity.clientId && !entity.dsmId) {
        clients.push({
          id: entity.id,
          centerId: entity.centerId,
          name: entity.name,
          monthlyGoal: entity.monthlyGoal
        });
      } else if (entity.dsmId) {
        pos.push({
          id: entity.id,
          dsmId: entity.dsmId,
          name: entity.name,
          monthlyGoal: entity.monthlyGoal
        });
      } else {
        dsms.push({
          id: entity.id,
          clientId: entity.clientId,
          name: entity.name,
          monthlyGoal: entity.monthlyGoal
        });
      }

      return entity;
    });

    return inserted;
  }
}

module.exports = new ImportService();
