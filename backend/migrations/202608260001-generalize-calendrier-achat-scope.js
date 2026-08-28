'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const description = await queryInterface.describeTable('calendrier_achat');
    if (!description.da_id) {
      await queryInterface.addColumn('calendrier_achat', 'da_id', {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: { model: 'da', key: 'id' }
      });
    }
    await queryInterface.changeColumn('calendrier_achat', 'pos_id', {
      type: Sequelize.STRING(36),
      allowNull: true,
      references: { model: 'pos', key: 'id' }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('calendrier_achat', 'da_id');
    await queryInterface.changeColumn('calendrier_achat', 'pos_id', {
      type: Sequelize.STRING(36),
      allowNull: false,
      references: { model: 'pos', key: 'id' }
    });
  }
};
