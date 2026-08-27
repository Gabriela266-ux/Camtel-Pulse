'use strict';

// Ajoute la colonne `poste_id` sur `utilisateur` (le poste choisi dans la
// demande d'accès). Il est important de distinguer `poste_id` (poste CAMTEL)
// de la colonne préexistante `pos_id` (Point Of Sale), qui est une entité
// réseau distincte et reste inchangée. La colonne est ajoutée côté nullable
// pour les comptes existants ; les nouvelles demandes fournissent un poste.
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('utilisateur');

    if (!columns.poste_id) {
      await queryInterface.addColumn('utilisateur', 'poste_id', {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: { model: 'poste', key: 'id' }
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('utilisateur');
    if (columns.poste_id) await queryInterface.removeColumn('utilisateur', 'poste_id');
  }
};