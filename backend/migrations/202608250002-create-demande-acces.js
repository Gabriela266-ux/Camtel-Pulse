'use strict';

// Table `demande_acces` : enregistre chaque demande d'accès (statut EN_ATTENTE).
// L'utilisateur est créé de façon INACTIF au dépôt de la demande ; l'approbation
// active son compte (statut 'actif') et le refus conserve la demande REFUSEE
// avec un motif obligatoire. `role_id` y est déjà déterminé par le poste choisi.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('demande_acces', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      utilisateur_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: 'utilisateur', key: 'id' }
      },
      poste_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: 'poste', key: 'id' }
      },
      role_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: 'role', key: 'id' }
      },
      nom_complet: { type: Sequelize.STRING(150), allowNull: false },
      matricule: { type: Sequelize.STRING(50), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false },
      telephone: { type: Sequelize.STRING(50), allowNull: true },
      statut: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'EN_ATTENTE'
      },
      motif_refus: { type: Sequelize.TEXT, allowNull: true },
      valide_par: {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: { model: 'utilisateur', key: 'id' }
      },
      valide_le: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('demande_acces', ['statut'], { name: 'idx_demande_statut' });
    await queryInterface.addIndex('demande_acces', ['poste_id'], { name: 'idx_demande_poste' });
    await queryInterface.addIndex('demande_acces', ['role_id'], { name: 'idx_demande_role' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('demande_acces');
  }
};