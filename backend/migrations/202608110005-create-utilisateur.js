'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('utilisateur', {
      id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      role_id: { type: Sequelize.STRING(36), allowNull: false, references: { model: 'role', key: 'id' } },
      da_id: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'da', key: 'id' } },
      zone_id: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'zone', key: 'id' } },
      id_manager: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'utilisateur', key: 'id' } },
      matricule: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      nom_complet: { type: Sequelize.STRING(150), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      telephone: { type: Sequelize.STRING(50), allowNull: true },
      mot_de_passe: { type: Sequelize.STRING(255), allowNull: false },
      statut: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'actif' },
      derniere_connexion: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('utilisateur');
  }
};