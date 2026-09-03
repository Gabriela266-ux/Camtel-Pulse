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

  async importFromCsv(content, { centreId } = {}) {
    if (!centreId) {
      const error = new Error('Aucun centre rattaché au compte administrateur');
      error.statusCode = 403;
      throw error;
    }
    const rows = this.parseCsvContent(content);
    if (!rows.length) {
      const error = new Error('Le fichier CSV ne contient aucune ligne exploitable');
      error.statusCode = 400;
      throw error;
    }
    const centre = await db.Centre.findOne({ where: { id: centreId, active: true } });
    if (!centre) {
      const error = new Error('Le centre rattaché est introuvable ou désactivé');
      error.statusCode = 403;
      throw error;
    }
    const inserted = [];
    await db.sequelize.transaction(async (transaction) => {
      for (const [index, row] of rows.entries()) {
        const type = String(row.type || '').trim().toLowerCase();
        const nom = String(row.nom || row.name || '').trim();
        if (!['da', 'dsm', 'pos'].includes(type) || !nom) {
          const error = new Error(`Ligne ${index + 2} : type (DA, DSM ou POS) et nom sont obligatoires`);
          error.statusCode = 400;
          throw error;
        }
        if (type === 'da') {
          const code = String(row.code || '').trim();
          if (!code) {
            const error = new Error(`Ligne ${index + 2} : le code du partenaire est obligatoire`);
            error.statusCode = 400;
            throw error;
          }
          inserted.push(await db.Da.create({
            centre_id: centreId,
            code,
            nom,
            region: String(row.region || '').trim() || centre.region,
            numero_sim: String(row.numero_sim || '').trim() || null,
            code_zone: String(row.code_zone || '').trim() || null,
            objectif_mensuel: Number(row.objectif || row.objectif_mensuel || 0),
            active: true,
          }, { transaction }));
        } else if (type === 'dsm') {
          const daId = String(row.da_id || '').trim();
          const parent = daId ? await db.Da.findByPk(daId, { transaction }) : null;
          if (!parent || String(parent.centre_id) !== String(centreId)) {
            const error = new Error(`Ligne ${index + 2} : partenaire parent introuvable dans votre centre`);
            error.statusCode = 400;
            throw error;
          }
          inserted.push(await db.Dsm.create({
            da_id: daId,
            nom,
            numero_telephone: String(row.numero_telephone || '').trim() || null,
            code_dsm: String(row.code_dsm || '').trim() || null,
            code_zone: String(row.code_zone || '').trim() || null,
            statut: 'actif',
          }, { transaction }));
        } else {
          const dsmId = String(row.dsm_id || '').trim();
          const parent = dsmId ? await db.Dsm.findByPk(dsmId, {
            transaction,
            include: [{ model: db.Da, as: 'da', required: true }],
          }) : null;
          if (!parent || !parent.da || String(parent.da.centre_id) !== String(centreId)) {
            const error = new Error(`Ligne ${index + 2} : DSM parent introuvable dans votre centre`);
            error.statusCode = 400;
            throw error;
          }
          inserted.push(await db.Pos.create({
            dsm_id: dsmId,
            nom,
            numero_telephone: String(row.numero_telephone || '').trim() || null,
            code_pos: String(row.code_pos || '').trim() || null,
            code_dsm: parent.code_dsm || null,
            code_zone: parent.code_zone || null,
            statut: 'actif',
          }, { transaction }));
        }
      }
    });

    return {
      success: true,
      totalImported: inserted.length,
      records: inserted.map((record) => ({ id: record.id, type: record.constructor.name, nom: record.nom }))
    };
  }
}

module.exports = new ImportService();
