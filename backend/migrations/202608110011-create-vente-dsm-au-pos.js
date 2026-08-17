'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vente_dsm_au_pos', {
      id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      dsm_id: { type: Sequelize.STRING(36), allowNull: false, references: { model: 'dsm', key: 'id' } },
      pos_id: { type: Sequelize.STRING(36), allowNull: false, references: { model: 'pos', key: 'id' } },
      utilisateur_id: { type: Sequelize.STRING(36), references: { model: 'utilisateur', key: 'id' } },
      date_vente: { type: Sequelize.DATEONLY, allowNull: false },
      quantite_vendu: { type: Sequelize.INTEGER, defaultValue: 0 },
      montant: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      date_saisir: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('vente_dsm_au_pos'); }
};