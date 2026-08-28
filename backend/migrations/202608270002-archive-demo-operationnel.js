'use strict';

const DEMO_OPERATIONNEL_ID = '11111111-1111-5111-8111-111111111113';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkUpdate('utilisateur', { statut: 'inactif' }, { id: DEMO_OPERATIONNEL_ID });
  },
  async down(queryInterface) {
    await queryInterface.bulkUpdate('utilisateur', { statut: 'actif' }, { id: DEMO_OPERATIONNEL_ID });
  }
};
