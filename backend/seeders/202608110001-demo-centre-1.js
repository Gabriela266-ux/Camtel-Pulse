'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
    up: async(queryInterface) => {
        const dateNow = new Date();
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        // 1. Identifiants UUID prédéfinis
        const zoneId = '00000000-0000-4000-8000-000000000001';
        const centreId = '11111111-1111-4111-8111-111111111111';

        const roleAdminId = 'a0000000-0000-4000-8000-000000000001';
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

        // 2. Zone
        await queryInterface.bulkInsert('zone', [{
            id: zoneId,
            nom_zone: 'Zone Littoral',
            region: 'Littoral',
            created_at: dateNow,
            updated_at: dateNow
        }]);

        // 3. Centre
        await queryInterface.bulkInsert('centre', [{
            id: centreId,
            nom_centre: 'CPDSM 1',
            region: 'Littoral',
            created_at: dateNow,
            updated_at: dateNow
        }]);

        // 4. Roles
        await queryInterface.bulkInsert('role', [
            { id: roleAdminId, libelle: 'Admin', description: 'Administrateur', created_at: dateNow, updated_at: dateNow },
            { id: roleAgentId, libelle: 'Agent', description: 'Agent Terrain', created_at: dateNow, updated_at: dateNow }
        ]);

        // 5. DA (Distributeurs Agréés)
        await queryInterface.bulkInsert('da', [{
                id: daIds.glotelho,
                centre_id: centreId,
                code: 'DA-001',
                nom: 'Glotelho',
                region: 'Littoral',
                numero_sim: '237690000001',
                objectif_mensuel: 3400000,
                active: true,
                created_at: dateNow,
                updated_at: dateNow
            },
            {
                id: daIds.masterColor,
                centre_id: centreId,
                code: 'DA-002',
                nom: 'Master Color',
                region: 'Littoral',
                numero_sim: '237690000002',
                objectif_mensuel: 2700000,
                active: true,
                created_at: dateNow,
                updated_at: dateNow
            }
        ]);

        // 6. Utilisateurs
        await queryInterface.bulkInsert('utilisateur', [{
                id: '11111111-1111-5111-8111-111111111111',
                role_id: roleAdminId,
                da_id: null,
                zone_id: zoneId,
                id_manager: null,
                matricule: 'ADM-001',
                nom_complet: 'Admin Principal',
                email: 'admin@camtel.local',
                telephone: '690000001',
                mot_de_passe: hashedPassword,
                statut: 'actif',
                created_at: dateNow,
                updated_at: dateNow
            },
            {
                id: '11111111-1111-5111-8111-111111111112',
                role_id: roleAgentId,
                da_id: daIds.glotelho,
                zone_id: zoneId,
                id_manager: '11111111-1111-5111-8111-111111111111',
                matricule: 'AGT-001',
                nom_complet: 'Chef Opérationnel',
                email: 'chef@camtel.local',
                telephone: '690000002',
                mot_de_passe: hashedPassword,
                statut: 'actif',
                created_at: dateNow,
                updated_at: dateNow
            }
        ]);

        // 7. DSM
        await queryInterface.bulkInsert('dsm', [
            { id: dsmIds.glotelho1, da_id: daIds.glotelho, zone_id: zoneId, nom: 'DSM Glotelho 1', raison_sociale: 'Glotelho SARL', adresse: 'Douala', contact: '+237690000010', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow },
            { id: dsmIds.glotelho2, da_id: daIds.glotelho, zone_id: zoneId, nom: 'DSM Glotelho 2', raison_sociale: 'Glotelho SARL', adresse: 'Douala', contact: '+237690000011', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow },
            { id: dsmIds.master1, da_id: daIds.masterColor, zone_id: zoneId, nom: 'DSM Master 1', raison_sociale: 'Master Color Ltd', adresse: 'Yaoundé', contact: '+237690000012', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow },
            { id: dsmIds.master2, da_id: daIds.masterColor, zone_id: zoneId, nom: 'DSM Master 2', raison_sociale: 'Master Color Ltd', adresse: 'Yaoundé', contact: '+237690000013', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow }
        ]);

        // 8. POS
        await queryInterface.bulkInsert('pos', [
            { id: posIds.g1a, dsm_id: dsmIds.glotelho1, zone_id: zoneId, nom: 'POS Glotelho 1A', raison_sociale: 'Point Glotelho 1A', adresse: 'Douala', contact: '+237690000014', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow },
            { id: posIds.g1b, dsm_id: dsmIds.glotelho1, zone_id: zoneId, nom: 'POS Glotelho 1B', raison_sociale: 'Point Glotelho 1B', adresse: 'Douala', contact: '+237690000015', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow },
            { id: posIds.g2a, dsm_id: dsmIds.glotelho2, zone_id: zoneId, nom: 'POS Glotelho 2A', raison_sociale: 'Point Glotelho 2A', adresse: 'Douala', contact: '+237690000016', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow },
            { id: posIds.m1a, dsm_id: dsmIds.master1, zone_id: zoneId, nom: 'POS Master 1A', raison_sociale: 'Point Master 1A', adresse: 'Yaoundé', contact: '+237690000017', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow },
            { id: posIds.m1b, dsm_id: dsmIds.master1, zone_id: zoneId, nom: 'POS Master 1B', raison_sociale: 'Point Master 1B', adresse: 'Yaoundé', contact: '+237690000018', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow },
            { id: posIds.m2a, dsm_id: dsmIds.master2, zone_id: zoneId, nom: 'POS Master 2A', raison_sociale: 'Point Master 2A', adresse: 'Yaoundé', contact: '+237690000019', statut: 'actif', date_adhesion: dateNow, created_at: dateNow, updated_at: dateNow }
        ]);
    },

    down: async(queryInterface) => {
        await queryInterface.bulkDelete('pos', null, {});
        await queryInterface.bulkDelete('dsm', null, {});
        await queryInterface.bulkDelete('utilisateur', null, {});
        await queryInterface.bulkDelete('da', null, {});
        await queryInterface.bulkDelete('role', null, {});
        await queryInterface.bulkDelete('centre', null, {});
        await queryInterface.bulkDelete('zone', null, {});
    }
};