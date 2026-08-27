'use strict';

// Une demande d'accès sélectionne désormais directement l'un des quatre rôles
// applicatifs. Le poste CAMTEL historique reste disponible mais devient facultatif.
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('demande_acces');
    if (columns.poste_id && columns.poste_id.allowNull === false) {
      await queryInterface.changeColumn('demande_acces', 'poste_id', {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: { model: 'poste', key: 'id' }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const nullRows = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS count FROM demande_acces WHERE poste_id IS NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (Number(nullRows[0] && nullRows[0].count) > 0) {
      throw new Error('Rollback impossible : des demandes sans poste existent.');
    }
    await queryInterface.changeColumn('demande_acces', 'poste_id', {
      type: Sequelize.STRING(36),
      allowNull: false,
      references: { model: 'poste', key: 'id' }
    });
  }
};
