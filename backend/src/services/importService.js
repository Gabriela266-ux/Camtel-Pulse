const db = require('../models');

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

  async importFromCsv(content) {
    const rows = this.parseCsvContent(content);
    const inserted = [];

    for (const row of rows) {
      try {
        const entity = {
          nom: row.nom || row.name || 'Importé',
          objectif_mensuel: Number(row.objectif || row.objectif_mensuel || 0),
          centre_id: row.centre_id || null,
          da_id: row.da_id || null,
          dsm_id: row.dsm_id || null
        };

        if (row.type === 'centre' || (!row.da_id && !row.dsm_id)) {
          const centre = await db.Centre.create(entity);
          inserted.push(centre);
        } else if (row.type === 'da' || (row.centre_id && !row.dsm_id)) {
          const da = await db.Da.create(entity);
          inserted.push(da);
        } else if (row.type === 'dsm' || (row.da_id && !row.dsm_id)) {
          const dsm = await db.Dsm.create(entity);
          inserted.push(dsm);
        } else if (row.type === 'pos' || row.dsm_id) {
          const pos = await db.Pos.create(entity);
          inserted.push(pos);
        }
      } catch (error) {
        console.error('Erreur import:', error.message);
      }
    }

    return inserted;
  }
}

module.exports = new ImportService();