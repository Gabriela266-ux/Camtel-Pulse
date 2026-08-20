'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('acht_journaliere', {
      id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      da_id: { type: Sequelize.STRING(36), allowNull: false, references: { model: 'da', key: 'id' } },
      utilisateur_id: { type: Sequelize.STRING(36), references: { model: 'utilisateur', key: 'id' } },
      date_achat: { type: Sequelize.DATEONLY, allowNull: false },
      montant_achat: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      date_saisir: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('acht_journaliere'); }
};