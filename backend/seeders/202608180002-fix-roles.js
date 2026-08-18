'use strict';
const bcrypt = require('bcryptjs');

const roleChefId = 'a0000000-0000-4000-8000-000000000003';
const roleManagerId = 'a0000000-0000-4000-8000-000000000004';
const roleOperationnelId = 'a0000000-0000-4000-8000-000000000005';

const chefUserId = '11111111-1111-5111-8111-111111111112';
const operateurUserId = '11111111-1111-5111-8111-111111111113';
const managerUserId = '11111111-1111-5111-8111-111111111114';

const daIds = {
  glotelho: '22222222-2222-4222-8222-222222222222',
  masterColor: '33333333-3333-4333-8333-333333333333'
};

module.exports = {
  up: async (queryInterface) => {
    const dateNow = new Date();
    const hashedManager = await bcrypt.hash('manager123', 10);

    // Les 4 rôles fixés par l'encadreur : admin, chef opérationnel, manager, opérationnel
    // ('Admin' existe déjà via le premier seeder — on ajoute les 3 autres).
    await queryInterface.bulkInsert('role', [
      { id: roleChefId, libelle: 'Chef Operationnel', description: 'Chef opérationnel', created_at: dateNow, updated_at: dateNow },
      { id: roleManagerId, libelle: 'Manager', description: 'Manager', created_at: dateNow, updated_at: dateNow },
      { id: roleOperationnelId, libelle: 'Operationnel', description: 'Agent opérationnel', created_at: dateNow, updated_at: dateNow }
    ]);

    // Réaffecte les utilisateurs existants créés avec le rôle générique 'Agent'
    // vers leur vrai rôle (chef opérationnel / opérationnel).
    // On passe une string déjà formatée pour updated_at : bulkUpdate + objet Date JS
    // écrit un entier (timestamp) au lieu d'un texte sur le driver sqlite3, ce qui fait
    // planter le parsing Sequelize à la lecture ("date.includes is not a function").
    const updatedAtStr = dateNow.toISOString().replace('T', ' ').replace('Z', ' +00:00');

    await queryInterface.bulkUpdate(
      'utilisateur',
      { role_id: roleChefId, updated_at: updatedAtStr },
      { id: chefUserId }
    );

    await queryInterface.bulkUpdate(
      'utilisateur',
      { role_id: roleOperationnelId, updated_at: updatedAtStr },
      { id: operateurUserId }
    );

    // Ajoute un compte de test manager (rôle absent jusqu'ici)
    await queryInterface.bulkInsert('utilisateur', [
      {
        id: managerUserId,
        role_id: roleManagerId,
        da_id: daIds.masterColor,
        zone_id: '00000000-0000-4000-8000-000000000001',
        id_manager: null,
        matricule: 'MGR-001',
        nom_complet: 'Manager Centre 1',
        email: 'manager@camtel.local',
        telephone: '690000004',
        mot_de_passe: hashedManager,
        statut: 'actif',
        created_at: dateNow,
        updated_at: dateNow
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('utilisateur', { id: managerUserId }, {});
    await queryInterface.bulkDelete('role', {
      id: [roleChefId, roleManagerId, roleOperationnelId]
    }, {});
  }
};
