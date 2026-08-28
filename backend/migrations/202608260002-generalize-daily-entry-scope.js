'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const achat = await queryInterface.describeTable('acht_journaliere');
    if (!achat.dsm_id) {
      await queryInterface.addColumn('acht_journaliere', 'dsm_id', {
        type: Sequelize.STRING(36), allowNull: true,
        references: { model: 'dsm', key: 'id' }
      });
    }
    if (!achat.scope_type) {
      await queryInterface.addColumn('acht_journaliere', 'scope_type', {
        type: Sequelize.STRING(10), allowNull: false, defaultValue: 'LEGACY'
      });
    }

    const stock = await queryInterface.describeTable('stock');
    if (!stock.da_id) {
      await queryInterface.addColumn('stock', 'da_id', {
        type: Sequelize.STRING(36), allowNull: true,
        references: { model: 'da', key: 'id' }
      });
    }
  },

  async down(queryInterface) {
    const stock = await queryInterface.describeTable('stock');
    if (stock.da_id) await queryInterface.removeColumn('stock', 'da_id');
    const achat = await queryInterface.describeTable('acht_journaliere');
    if (achat.scope_type) await queryInterface.removeColumn('acht_journaliere', 'scope_type');
    if (achat.dsm_id) await queryInterface.removeColumn('acht_journaliere', 'dsm_id');
  }
};
