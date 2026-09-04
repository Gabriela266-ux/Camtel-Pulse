'use strict';

async function tableIndexes(queryInterface, tableName) {
  return queryInterface.showIndex(tableName);
}

async function indexNames(queryInterface, tableName) {
  return new Set((await tableIndexes(queryInterface, tableName)).map((index) => index.name));
}

async function addUniqueIndexIfMissing(queryInterface, tableName, fields, name, transaction) {
  const indexes = await tableIndexes(queryInterface, tableName);
  const alreadyCovered = indexes.some((index) => (
    index.unique &&
    index.fields.map((field) => field.attribute).join('|') === fields.join('|')
  ));
  if (!alreadyCovered && !indexes.some((index) => index.name === name)) {
    await queryInterface.addIndex(tableName, fields, { name, unique: true, transaction });
  }
}

module.exports = {
  async up(queryInterface, _Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'sqlite') {
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.sequelize.query(`
          CREATE TABLE calendrier_achat_network_scope (
            id VARCHAR(36) PRIMARY KEY NOT NULL,
            da_id VARCHAR(36) REFERENCES da(id),
            dsm_id VARCHAR(36) REFERENCES dsm(id),
            pos_id VARCHAR(36) REFERENCES pos(id),
            utilisateur_id VARCHAR(36) REFERENCES utilisateur(id),
            date_prevue DATE NOT NULL,
            quantite_prevue DECIMAL(15,2) NOT NULL DEFAULT 0,
            date_saisir DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            CHECK (
              (CASE WHEN da_id IS NULL THEN 0 ELSE 1 END) +
              (CASE WHEN dsm_id IS NULL THEN 0 ELSE 1 END) +
              (CASE WHEN pos_id IS NULL THEN 0 ELSE 1 END) = 1
            )
          )
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO calendrier_achat_network_scope (
            id, da_id, dsm_id, pos_id, utilisateur_id, date_prevue,
            quantite_prevue, date_saisir, created_at, updated_at
          )
          SELECT
            id, da_id, CASE WHEN pos_id IS NULL THEN dsm_id ELSE NULL END,
            pos_id, utilisateur_id, date_prevue,
            quantite_prevue, date_saisir, created_at, updated_at
          FROM calendrier_achat
        `, { transaction });

        await queryInterface.dropTable('calendrier_achat', { transaction });
        await queryInterface.renameTable('calendrier_achat_network_scope', 'calendrier_achat', { transaction });

        await addUniqueIndexIfMissing(
          queryInterface, 'calendrier_achat', ['da_id', 'date_prevue'],
          'calendrier_achat_da_date_unique', transaction
        );
        await addUniqueIndexIfMissing(
          queryInterface, 'calendrier_achat', ['dsm_id', 'date_prevue'],
          'calendrier_achat_dsm_date_unique', transaction
        );
        await addUniqueIndexIfMissing(
          queryInterface, 'calendrier_achat', ['pos_id', 'date_prevue'],
          'calendrier_achat_pos_date_unique', transaction
        );
      });
    } else {
      await addUniqueIndexIfMissing(queryInterface, 'calendrier_achat', ['da_id', 'date_prevue'], 'calendrier_achat_da_date_unique');
      await addUniqueIndexIfMissing(queryInterface, 'calendrier_achat', ['dsm_id', 'date_prevue'], 'calendrier_achat_dsm_date_unique');
      await addUniqueIndexIfMissing(queryInterface, 'calendrier_achat', ['pos_id', 'date_prevue'], 'calendrier_achat_pos_date_unique');
    }

    await addUniqueIndexIfMissing(queryInterface, 'prevision_journaliere', ['da_id', 'date_prevision'], 'prevision_journaliere_da_date_unique');
    await addUniqueIndexIfMissing(queryInterface, 'prevision_journaliere', ['dsm_id', 'date_prevision'], 'prevision_journaliere_dsm_date_unique');
    await addUniqueIndexIfMissing(queryInterface, 'prevision_journaliere', ['pos_id', 'date_prevision'], 'prevision_journaliere_pos_date_unique');
  },

  async down(queryInterface) {
    const removals = [
      ['calendrier_achat', 'calendrier_achat_da_date_unique'],
      ['calendrier_achat', 'calendrier_achat_dsm_date_unique'],
      ['prevision_journaliere', 'prevision_journaliere_da_date_unique'],
      ['prevision_journaliere', 'prevision_journaliere_dsm_date_unique'],
    ];
    for (const [tableName, indexName] of removals) {
      const names = await indexNames(queryInterface, tableName);
      if (names.has(indexName)) await queryInterface.removeIndex(tableName, indexName);
    }
  },
};
