'use strict';

const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('affectation_operationnel_partenaire')) {
      await queryInterface.createTable('affectation_operationnel_partenaire', {
        id: {
          type: Sequelize.STRING(36),
          allowNull: false,
          primaryKey: true
        },
        utilisateur_id: {
          type: Sequelize.STRING(36),
          allowNull: false,
          references: { model: 'utilisateur', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        da_id: {
          type: Sequelize.STRING(36),
          allowNull: false,
          references: { model: 'da', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        statut: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'actif'
        },
        affecte_par: {
          type: Sequelize.STRING(36),
          allowNull: true,
          references: { model: 'utilisateur', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex(
        'affectation_operationnel_partenaire',
        ['utilisateur_id', 'da_id'],
        { unique: true, name: 'affectation_operationnel_partenaire_unique' }
      );
      await queryInterface.addIndex(
        'affectation_operationnel_partenaire',
        ['da_id', 'statut'],
        { name: 'affectation_partenaire_statut_idx' }
      );
    }

    // Préserve les affectations existantes sans créer de données factices.
    const [legacyAssignments] = await queryInterface.sequelize.query(
      `SELECT u.id AS utilisateur_id, u.da_id
       FROM utilisateur u
       INNER JOIN role r ON r.id = u.role_id
       WHERE u.da_id IS NOT NULL
         AND LOWER(REPLACE(r.libelle, ' ', '_')) = 'operationnel'`
    );
    for (const row of legacyAssignments) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM affectation_operationnel_partenaire
         WHERE utilisateur_id = :utilisateurId AND da_id = :daId
         LIMIT 1`,
        { replacements: { utilisateurId: row.utilisateur_id, daId: row.da_id } }
      );
      if (!existing.length) {
        await queryInterface.bulkInsert('affectation_operationnel_partenaire', [{
          id: randomUUID(),
          utilisateur_id: row.utilisateur_id,
          da_id: row.da_id,
          statut: 'actif',
          affecte_par: null,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      }
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('affectation_operationnel_partenaire')) {
      await queryInterface.dropTable('affectation_operationnel_partenaire');
    }
  }
};
