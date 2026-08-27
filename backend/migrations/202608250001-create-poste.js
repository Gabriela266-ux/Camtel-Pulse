'use strict';

// Table `poste` : liste fermée des postes CAMTEL. Chaque poste détermine
// automatiquement le rôle système associé via sa clé étrangère `role_id`.
// C'est cette relation qui garantit que `role_id` n'est jamais saisi à la main
// ni laissé NULL lors d'une demande d'accès.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('poste', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      libelle: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      role_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: 'role', key: 'id' }
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('poste', ['role_id'], { name: 'idx_poste_role' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('poste');
  }
};