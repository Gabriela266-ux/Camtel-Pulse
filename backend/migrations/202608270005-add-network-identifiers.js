'use strict';

async function addColumnIfMissing(queryInterface, table, columns, name, definition) {
  if (!columns[name]) {
    await queryInterface.addColumn(table, name, definition);
  }
}

async function addIndexIfMissing(queryInterface, table, name, fields, options = {}) {
  const indexes = await queryInterface.showIndex(table);
  if (!indexes.some((index) => index.name === name)) {
    await queryInterface.addIndex(table, fields, { ...options, name });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const daColumns = await queryInterface.describeTable('da');
    const dsmColumns = await queryInterface.describeTable('dsm');
    const posColumns = await queryInterface.describeTable('pos');

    await addColumnIfMissing(queryInterface, 'da', daColumns, 'code_zone', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await addColumnIfMissing(queryInterface, 'dsm', dsmColumns, 'numero_telephone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'dsm', dsmColumns, 'code_dsm', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'dsm', dsmColumns, 'code_zone', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await addColumnIfMissing(queryInterface, 'pos', posColumns, 'numero_telephone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'pos', posColumns, 'code_pos', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'pos', posColumns, 'code_dsm', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'pos', posColumns, 'code_zone', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await addIndexIfMissing(queryInterface, 'dsm', 'dsm_numero_telephone_unique', ['numero_telephone'], { unique: true });
    await addIndexIfMissing(queryInterface, 'dsm', 'dsm_da_code_unique', ['da_id', 'code_dsm'], { unique: true });
    await addIndexIfMissing(queryInterface, 'dsm', 'dsm_code_zone_idx', ['code_zone']);
    await addIndexIfMissing(queryInterface, 'pos', 'pos_numero_telephone_unique', ['numero_telephone'], { unique: true });
    await addIndexIfMissing(queryInterface, 'pos', 'pos_dsm_code_unique', ['dsm_id', 'code_pos'], { unique: true });
    await addIndexIfMissing(queryInterface, 'pos', 'pos_code_zone_idx', ['code_zone']);
    await addIndexIfMissing(queryInterface, 'da', 'da_code_zone_idx', ['code_zone']);
  },

  async down(queryInterface) {
    const removeIndex = async (table, name) => {
      const indexes = await queryInterface.showIndex(table);
      if (indexes.some((index) => index.name === name)) await queryInterface.removeIndex(table, name);
    };
    const removeColumn = async (table, name) => {
      const columns = await queryInterface.describeTable(table);
      if (columns[name]) await queryInterface.removeColumn(table, name);
    };

    await removeIndex('da', 'da_code_zone_idx');
    await removeIndex('dsm', 'dsm_code_zone_idx');
    await removeIndex('dsm', 'dsm_da_code_unique');
    await removeIndex('dsm', 'dsm_numero_telephone_unique');
    await removeIndex('pos', 'pos_code_zone_idx');
    await removeIndex('pos', 'pos_dsm_code_unique');
    await removeIndex('pos', 'pos_numero_telephone_unique');

    await removeColumn('da', 'code_zone');
    await removeColumn('dsm', 'numero_telephone');
    await removeColumn('dsm', 'code_dsm');
    await removeColumn('dsm', 'code_zone');
    await removeColumn('pos', 'numero_telephone');
    await removeColumn('pos', 'code_pos');
    await removeColumn('pos', 'code_dsm');
    await removeColumn('pos', 'code_zone');
  },
};
