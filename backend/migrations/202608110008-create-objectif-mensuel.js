'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('objectif_mensuel', {
      id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      da_id: { type: Sequelize.STRING(36), references: { model: 'da', key: 'id' }, onDelete: 'CASCADE' },
      dsm_id: { type: Sequelize.STRING(36), references: { model: 'dsm', key: 'id' }, onDelete: 'CASCADE' },
      pos_id: { type: Sequelize.STRING(36), references: { model: 'pos', key: 'id' }, onDelete: 'CASCADE' },
      annee: { type: Sequelize.INTEGER, allowNull: false },
      mois: { type: Sequelize.INTEGER, allowNull: false },
      montant_objectif: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      statut: { type: Sequelize.STRING(50), defaultValue: 'en_cours' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('objectif_mensuel'); }
};