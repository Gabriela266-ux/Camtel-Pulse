'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('zone', {
      id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      nom_zone: { type: Sequelize.STRING(100), allowNull: false },
      region: { type: Sequelize.STRING(100), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('zone'); }
};