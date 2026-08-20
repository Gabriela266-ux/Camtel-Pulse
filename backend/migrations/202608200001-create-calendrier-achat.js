'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calendrier_achat', {
      id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      dsm_id: { type: Sequelize.STRING(36), references: { model: 'dsm', key: 'id' } },
      pos_id: { type: Sequelize.STRING(36), allowNull: false, references: { model: 'pos', key: 'id' } },
      utilisateur_id: { type: Sequelize.STRING(36), references: { model: 'utilisateur', key: 'id' } },
      date_prevue: { type: Sequelize.DATEONLY, allowNull: false },
      quantite_prevue: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      date_saisir: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('calendrier_achat', ['pos_id', 'date_prevue'], {
      unique: true,
      name: 'calendrier_achat_pos_date_unique'
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('calendrier_achat'); }
};
