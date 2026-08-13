'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock', {
      id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      dsm_id: { type: Sequelize.STRING(36), references: { model: 'dsm', key: 'id' } },
      pos_id: { type: Sequelize.STRING(36), references: { model: 'pos', key: 'id' } },
      utilisateur_id: { type: Sequelize.STRING(36), references: { model: 'utilisateur', key: 'id' } },
      date_stock: { type: Sequelize.DATEONLY, allowNull: false },
      quantite_credit: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      statut: { type: Sequelize.STRING(50), defaultValue: 'disponible' },
      date_saisir: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('stock'); }
};