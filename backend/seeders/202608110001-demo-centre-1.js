const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const centreId = '11111111-1111-4111-8111-111111111111';
    const daIds = {
      glotelho: '22222222-2222-4222-8222-222222222222',
      masterColor: '33333333-3333-4333-8333-333333333333'
    };

    const dsmIds = {
      glotelho1: '44444444-4444-4444-8444-444444444444',
      glotelho2: '55555555-5555-4555-8555-555555555555',
      master1: '66666666-6666-4666-8666-666666666666',
      master2: '77777777-7777-4777-8777-777777777777'
    };

    const posIds = {
      g1a: '88888888-8888-4888-8888-888888888888',
      g1b: '99999999-9999-4999-8999-999999999999',
      g2a: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      m1a: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      m1b: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      m2a: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    };

    await queryInterface.bulkInsert('centres', [{
      id: centreId,
      code: 'CDPSM-01',
      nom: 'Centre 1 CDPSM',
      region: 'Littoral',
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    await queryInterface.bulkInsert('da', [
      {
        id: daIds.glotelho,
        centre_id: centreId,
        code: 'DA-001',
        nom: 'Glotelho',
        objectif_mensuel: 3400000,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: daIds.masterColor,
        centre_id: centreId,
        code: 'DA-002',
        nom: 'Master Color',
        objectif_mensuel: 2700000,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    await queryInterface.bulkInsert('dsm', [
      { id: dsmIds.glotelho1, da_id: daIds.glotelho, code: 'DSM-G1', nom: 'DSM Glotelho 1', objectif_mensuel: 1500000, active: true, created_at: new Date(), updated_at: new Date() },
      { id: dsmIds.glotelho2, da_id: daIds.glotelho, code: 'DSM-G2', nom: 'DSM Glotelho 2', objectif_mensuel: 1900000, active: true, created_at: new Date(), updated_at: new Date() },
      { id: dsmIds.master1, da_id: daIds.masterColor, code: 'DSM-M1', nom: 'DSM Master 1', objectif_mensuel: 1100000, active: true, created_at: new Date(), updated_at: new Date() },
      { id: dsmIds.master2, da_id: daIds.masterColor, code: 'DSM-M2', nom: 'DSM Master 2', objectif_mensuel: 1600000, active: true, created_at: new Date(), updated_at: new Date() }
    ]);

    await queryInterface.bulkInsert('pos', [
      { id: posIds.g1a, dsm_id: dsmIds.glotelho1, code: 'POS-G1-A', nom: 'POS Glotelho 1A', objectif_mensuel: 600000, active: true, created_at: new Date(), updated_at: new Date() },
      { id: posIds.g1b, dsm_id: dsmIds.glotelho1, code: 'POS-G1-B', nom: 'POS Glotelho 1B', objectif_mensuel: 900000, active: true, created_at: new Date(), updated_at: new Date() },
      { id: posIds.g2a, dsm_id: dsmIds.glotelho2, code: 'POS-G2-A', nom: 'POS Glotelho 2A', objectif_mensuel: 750000, active: true, created_at: new Date(), updated_at: new Date() },
      { id: posIds.m1a, dsm_id: dsmIds.master1, code: 'POS-M1-A', nom: 'POS Master 1A', objectif_mensuel: 480000, active: true, created_at: new Date(), updated_at: new Date() },
      { id: posIds.m1b, dsm_id: dsmIds.master1, code: 'POS-M1-B', nom: 'POS Master 1B', objectif_mensuel: 620000, active: true, created_at: new Date(), updated_at: new Date() },
      { id: posIds.m2a, dsm_id: dsmIds.master2, code: 'POS-M2-A', nom: 'POS Master 2A', objectif_mensuel: 1600000, active: true, created_at: new Date(), updated_at: new Date() }
    ]);

    await queryInterface.bulkInsert('utilisateurs', [
      {
        id: '11111111-1111-5111-8111-111111111111',
        centre_id: centreId,
        da_id: null,
        dsm_id: null,
        pos_id: null,
        nom: 'Admin',
        prenom: 'Principal',
        email: 'admin@camtel.local',
        password_hash: await bcrypt.hash('Admin123!', 10),
        role: 'admin',
        actif: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '11111111-1111-5111-8111-111111111112',
        centre_id: centreId,
        da_id: daIds.glotelho,
        dsm_id: null,
        pos_id: null,
        nom: 'Chef',
        prenom: 'Opérationnel',
        email: 'chef@camtel.local',
        password_hash: await bcrypt.hash('Chef123!', 10),
        role: 'chef_operationnel',
        actif: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '11111111-1111-5111-8111-111111111113',
        centre_id: centreId,
        da_id: daIds.glotelho,
        dsm_id: dsmIds.glotelho1,
        pos_id: posIds.g1a,
        nom: 'Opérateur',
        prenom: 'A',
        email: 'operateur@camtel.local',
        password_hash: await bcrypt.hash('Op123456!', 10),
        role: 'operational',
        actif: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '11111111-1111-5111-8111-111111111114',
        centre_id: centreId,
        da_id: daIds.masterColor,
        dsm_id: dsmIds.master2,
        pos_id: posIds.m2a,
        nom: 'Manager',
        prenom: 'Littoral',
        email: 'manager@camtel.local',
        password_hash: await bcrypt.hash('Manager123!', 10),
        role: 'manager',
        actif: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('utilisateurs', null, {});
    await queryInterface.bulkDelete('pos', null, {});
    await queryInterface.bulkDelete('dsm', null, {});
    await queryInterface.bulkDelete('da', null, {});
    await queryInterface.bulkDelete('centres', null, {});
  }
};
