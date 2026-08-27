'use strict';

// Stockage des tableaux « Suivi journalier » enregistrés depuis le frontend.
// Un snapshot est immuable : aucun endpoint de modification n'existe ;
// l'Admin et le Manager peuvent uniquement le consulter / télécharger.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('table_snapshot', {
      id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      entite_type: { type: Sequelize.STRING(10), allowNull: false },
      entite_id: { type: Sequelize.STRING(36), allowNull: false },
      entite_nom: { type: Sequelize.STRING(150), allowNull: true },
      periode: { type: Sequelize.STRING(7), allowNull: false },
      lignes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      payload: { type: Sequelize.TEXT, allowNull: false },
      total_stock: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      total_prevision: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      total_achat: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      cumul_achat_final: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      created_by: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'utilisateur', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('table_snapshot', ['entite_type', 'entite_id', 'periode'], {
      unique: true,
      name: 'uq_snapshot_entite_periode'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('table_snapshot');
  }
};