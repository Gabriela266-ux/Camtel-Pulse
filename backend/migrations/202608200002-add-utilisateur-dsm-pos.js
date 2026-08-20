'use strict';

// Le modèle Utilisateur (src/models/Utilisateur.js) référence dsm_id et pos_id,
// mais aucune migration ne les avait créés sur la table `utilisateur` — d'où
// l'erreur "no such column: Utilisateur.dsm_id" au login. Cette migration les
// ajoute si absents (vérification via describeTable, pour rester sans danger
// même si l'un des deux existe déjà).
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('utilisateur');

    if (!columns.dsm_id) {
      await queryInterface.addColumn('utilisateur', 'dsm_id', {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: { model: 'dsm', key: 'id' }
      });
    }

    if (!columns.pos_id) {
      await queryInterface.addColumn('utilisateur', 'pos_id', {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: { model: 'pos', key: 'id' }
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('utilisateur');
    if (columns.dsm_id) await queryInterface.removeColumn('utilisateur', 'dsm_id');
    if (columns.pos_id) await queryInterface.removeColumn('utilisateur', 'pos_id');
  }
};