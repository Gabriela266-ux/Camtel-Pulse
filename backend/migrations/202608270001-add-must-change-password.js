'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('utilisateur');
    if (!table.must_change_password) {
      await queryInterface.addColumn('utilisateur', 'must_change_password', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },
  async down(queryInterface) {
    const table = await queryInterface.describeTable('utilisateur');
    if (table.must_change_password) await queryInterface.removeColumn('utilisateur', 'must_change_password');
  }
};
