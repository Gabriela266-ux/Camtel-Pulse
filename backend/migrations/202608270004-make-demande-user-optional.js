'use strict';

// Conserve l'historique d'une demande d'accès après suppression du compte.
// Les informations du demandeur sont déjà dénormalisées dans demande_acces.
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('demande_acces');
    if (columns.utilisateur_id && columns.utilisateur_id.allowNull === false) {
      await queryInterface.changeColumn('demande_acces', 'utilisateur_id', {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: { model: 'utilisateur', key: 'id' }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const nullRows = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS count FROM demande_acces WHERE utilisateur_id IS NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (Number(nullRows[0] && nullRows[0].count) > 0) {
      throw new Error('Rollback impossible : des demandes sont détachées de leur ancien compte.');
    }
    await queryInterface.changeColumn('demande_acces', 'utilisateur_id', {
      type: Sequelize.STRING(36),
      allowNull: false,
      references: { model: 'utilisateur', key: 'id' }
    });
  }
};
