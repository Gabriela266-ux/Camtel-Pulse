'use strict';

// Remplit la table `poste` avec la liste fermée des postes CAMTEL et leur rôle
// système associé. La correspondance poste -> rôle est fixée par l'encadreur :
//   Animateur territorial  -> Opérationnel
//   Appui                  -> Opérationnel
//   Chef section           -> Chef opérationnel
//   Chef centre            -> Chef opérationnel
//   Chef service           -> Manager
//   Chef département       -> Manager
//   Directeur              -> Manager
//   Support informatique   -> Administrateur
const normalize = (value) =>
  String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/_-]+/g, ' ').replace(/\s+/g, ' ').trim();

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = await queryInterface.sequelize.query(
      'SELECT id, libelle FROM role',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const findRole = (libelle) => {
      const role = roles.find((item) => normalize(item.libelle) === normalize(libelle));
      if (!role) throw new Error(`Role introuvable pour le poste: ${libelle}`);
      return role.id;
    };

    const dateNow = new Date();
    const updatedAtStr = dateNow.toISOString().replace('T', ' ').replace('Z', ' +00:00');

    const rawPostes = [
      { id: 'e0000000-0000-4000-8000-000000000001', libelle: 'Animateur territorial', role: 'Operationnel' },
      { id: 'e0000000-0000-4000-8000-000000000002', libelle: 'Appui', role: 'Operationnel' },
      { id: 'e0000000-0000-4000-8000-000000000003', libelle: 'Chef section', role: 'Chef Operationnel' },
      { id: 'e0000000-0000-4000-8000-000000000004', libelle: 'Chef centre', role: 'Chef Operationnel' },
      { id: 'e0000000-0000-4000-8000-000000000005', libelle: 'Chef service', role: 'Manager' },
      { id: 'e0000000-0000-4000-8000-000000000006', libelle: 'Chef département', role: 'Manager' },
      { id: 'e0000000-0000-4000-8000-000000000007', libelle: 'Directeur', role: 'Manager' },
      { id: 'e0000000-0000-4000-8000-000000000008', libelle: 'Support informatique', role: 'Admin' }
    ];

    await queryInterface.bulkInsert('poste', rawPostes.map(({ id, libelle, role }) => ({
      id,
      libelle,
      role_id: findRole(role),
      created_at: updatedAtStr,
      updated_at: updatedAtStr
    })));
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('poste', null, {});
  }
};