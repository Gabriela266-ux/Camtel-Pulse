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
    const errors = [];

    // Process in batches of 500 to avoid memory overload
    const BATCH_SIZE = 500;
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const entities = batch.map(row => ({
        nom: row.nom || row.name || 'Importé',
        objectif_mensuel: Number(row.objectif || row.objectif_mensuel || 0),
        centre_id: row.centre_id || null,
        da_id: row.da_id || null,
        dsm_id: row.dsm_id || null,
        type: row.type || 'unknown'
      }));

      try {
        // Determine entity type and bulk create
        const centreRows = entities.filter(e => e.type === 'centre' || (!e.da_id && !e.dsm_id && !e.centre_id));
        const daRows = entities.filter(e => e.type === 'da' || (e.centre_id && !e.dsm_id && !e.da_id));
        const dsmRows = entities.filter(e => e.type === 'dsm' || (e.da_id && !e.dsm_id));
        const posRows = entities.filter(e => e.type === 'pos' || e.dsm_id);

        if (centreRows.length > 0) {
          const created = await db.Centre.bulkCreate(centreRows, { ignoreDuplicates: true });
          inserted.push(...created);
        }
        if (daRows.length > 0) {
          const created = await db.Da.bulkCreate(daRows, { ignoreDuplicates: true });
          inserted.push(...created);
        }
        if (dsmRows.length > 0) {
          const created = await db.Dsm.bulkCreate(dsmRows, { ignoreDuplicates: true });
          inserted.push(...created);
        }
        if (posRows.length > 0) {
          const created = await db.Pos.bulkCreate(posRows, { ignoreDuplicates: true });
          inserted.push(...created);
        }

        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${inserted.length} total imported`);
      } catch (error) {
        console.error(`Batch error at row ${i}:`, error.message);
        errors.push({ batch: Math.floor(i / BATCH_SIZE), error: error.message });
      }
    }

    if (errors.length > 0) {
      console.warn(`Import completed with ${errors.length} batch error(s)`);
    }

    return {
      success: true,
      totalImported: inserted.length,
      errors,
      records: inserted
    };
  }
}

module.exports = new ImportService();