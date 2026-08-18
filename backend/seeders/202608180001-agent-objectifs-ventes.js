'use strict';
const bcrypt = require('bcryptjs');

// Reprend les UUID définis dans 202608110001-demo-centre-1.js
const roleAgentId = 'a0000000-0000-4000-8000-000000000002';
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

const operateurId = '11111111-1111-5111-8111-111111111113';

function objectifRow(id, targetKey, targetId, montant, dateNow) {
  return {
    id,
    da_id: targetKey === 'da' ? targetId : null,
    dsm_id: targetKey === 'dsm' ? targetId : null,
    pos_id: targetKey === 'pos' ? targetId : null,
    annee: 2026,
    mois: 8,
    montant_objectif: montant,
    statut: 'en_cours',
    created_at: dateNow,
    updated_at: dateNow
  };
}

module.exports = {
  up: async (queryInterface) => {
    const dateNow = new Date();
    const hashedOperateur = await bcrypt.hash('operateur123', 10);

    // Utilisateur opérationnel manquant (les 2 autres existent déjà via le seeder précédent)
    await queryInterface.bulkInsert('utilisateur', [
      {
        id: operateurId,
        role_id: roleAgentId,
        da_id: daIds.masterColor,
        zone_id: '00000000-0000-4000-8000-000000000001',
        id_manager: '11111111-1111-5111-8111-111111111112',
        matricule: 'AGT-002',
        nom_complet: 'Opérationnel Master Color',
        email: 'operateur@camtel.local',
        telephone: '690000003',
        mot_de_passe: hashedOperateur,
        statut: 'actif',
        created_at: dateNow,
        updated_at: dateNow
      }
    ]);

    // Objectifs mensuels DSM (répartition de l'objectif du DA parent)
    await queryInterface.bulkInsert('objectif_mensuel', [
      objectifRow('f0000001-0000-4000-8000-000000000001', 'dsm', dsmIds.glotelho1, 1700000, dateNow),
      objectifRow('f0000001-0000-4000-8000-000000000002', 'dsm', dsmIds.glotelho2, 1700000, dateNow),
      objectifRow('f0000001-0000-4000-8000-000000000003', 'dsm', dsmIds.master1, 1350000, dateNow),
      objectifRow('f0000001-0000-4000-8000-000000000004', 'dsm', dsmIds.master2, 1350000, dateNow),

      // Objectifs mensuels POS (répartition de l'objectif du DSM parent)
      objectifRow('f0000002-0000-4000-8000-000000000001', 'pos', posIds.g1a, 900000, dateNow),
      objectifRow('f0000002-0000-4000-8000-000000000002', 'pos', posIds.g1b, 800000, dateNow),
      objectifRow('f0000002-0000-4000-8000-000000000003', 'pos', posIds.g2a, 1700000, dateNow),
      objectifRow('f0000002-0000-4000-8000-000000000004', 'pos', posIds.m1a, 700000, dateNow),
      objectifRow('f0000002-0000-4000-8000-000000000005', 'pos', posIds.m1b, 650000, dateNow),
      objectifRow('f0000002-0000-4000-8000-000000000006', 'pos', posIds.m2a, 1350000, dateNow)
    ]);

    // Ventes d'exemple (5 derniers jours) pour que les KPI dashboard ne soient pas à zéro
    const days = ['2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16', '2026-08-17'];
    const ventes = [];
    let counter = 1;

    const posToDsm = {
      [posIds.g1a]: dsmIds.glotelho1,
      [posIds.g1b]: dsmIds.glotelho1,
      [posIds.g2a]: dsmIds.glotelho2,
      [posIds.m1a]: dsmIds.master1,
      [posIds.m1b]: dsmIds.master1,
      [posIds.m2a]: dsmIds.master2
    };

    Object.entries(posToDsm).forEach(([posId, dsmId]) => {
      days.forEach((day, idx) => {
        const base = 25000 + idx * 1500;
        ventes.push({
          id: `f0000003-0000-4000-8000-${String(counter).padStart(12, '0')}`,
          dsm_id: dsmId,
          pos_id: posId,
          utilisateur_id: operateurId,
          date_vente: day,
          quantite_vendu: Math.round(base / 500),
          montant: base,
          date_saisir: dateNow,
          created_at: dateNow,
          updated_at: dateNow
        });
        counter += 1;
      });
    });

    await queryInterface.bulkInsert('vente_dsm_au_pos', ventes);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('vente_dsm_au_pos', null, {});
    await queryInterface.bulkDelete('objectif_mensuel', null, {});
    await queryInterface.bulkDelete('utilisateur', { id: operateurId }, {});
  }
};
