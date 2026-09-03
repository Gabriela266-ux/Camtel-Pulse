'use strict';

const bcrypt = require('bcryptjs');

const SUPER_ADMIN_ROLE_ID = 'a0000000-0000-4000-8000-000000000006';
const SUPER_ADMIN_USER_ID = '11111111-1111-5111-8111-111111111116';

async function columnNames(queryInterface, tableName) {
  return Object.keys(await queryInterface.describeTable(tableName));
}

async function addColumnIfMissing(queryInterface, tableName, name, definition) {
  if (!(await columnNames(queryInterface, tableName)).includes(name)) {
    await queryInterface.addColumn(tableName, name, definition);
  }
}

async function indexNames(queryInterface, tableName) {
  return new Set((await queryInterface.showIndex(tableName)).map((index) => index.name));
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await addColumnIfMissing(queryInterface, 'centre', 'code_centre', {
      type: Sequelize.STRING(50), allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'centre', 'telephone', {
      type: Sequelize.STRING(30), allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'centre', 'active', {
      type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true,
    });
    await addColumnIfMissing(queryInterface, 'utilisateur', 'centre_id', {
      type: Sequelize.STRING(36), allowNull: true,
      references: { model: 'centre', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    });
    await addColumnIfMissing(queryInterface, 'demande_acces', 'centre_id', {
      type: Sequelize.STRING(36), allowNull: true,
      references: { model: 'centre', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    });

    const [centres] = await queryInterface.sequelize.query(
      'SELECT id, nom_centre, code_centre FROM centre ORDER BY created_at, id'
    );
    let nextNumber = 1;
    for (const centre of centres) {
      const existingMatch = String(centre.code_centre || '').match(/^CPDSM\s+(\d+)$/i);
      if (existingMatch) {
        nextNumber = Math.max(nextNumber, Number(existingMatch[1]) + 1);
        continue;
      }
      const nameMatch = String(centre.nom_centre || '').match(/(?:CPDSM|CDPSM|CENTRE)\s*(\d+)/i);
      const preferred = nameMatch ? Number(nameMatch[1]) : nextNumber;
      const used = new Set(centres.map((item) => String(item.code_centre || '').toUpperCase()));
      let candidate = preferred;
      while (used.has(`CPDSM ${candidate}`)) candidate += 1;
      await queryInterface.sequelize.query(
        'UPDATE centre SET code_centre = :code, active = COALESCE(active, 1) WHERE id = :id',
        { replacements: { code: `CPDSM ${candidate}`, id: centre.id } }
      );
      nextNumber = Math.max(nextNumber, candidate + 1);
    }

    // 1) relation DA historique ; 2) affectation explicite existante.
    await queryInterface.sequelize.query(`
      UPDATE utilisateur
      SET centre_id = (
        SELECT da.centre_id FROM da WHERE da.id = utilisateur.da_id
      )
      WHERE centre_id IS NULL AND da_id IS NOT NULL
    `);
    await queryInterface.sequelize.query(`
      UPDATE utilisateur
      SET centre_id = (
        SELECT da.centre_id
        FROM affectation_operationnel_partenaire a
        JOIN da ON da.id = a.da_id
        WHERE a.utilisateur_id = utilisateur.id
        ORDER BY a.created_at LIMIT 1
      )
      WHERE centre_id IS NULL
        AND EXISTS (SELECT 1 FROM affectation_operationnel_partenaire a WHERE a.utilisateur_id = utilisateur.id)
    `);

    // Cas legacy non ambigu : la base possédait historiquement un seul centre.
    if (centres.length === 1) {
      await queryInterface.sequelize.query(
        'UPDATE utilisateur SET centre_id = :centreId WHERE centre_id IS NULL',
        { replacements: { centreId: centres[0].id } }
      );
    }
    await queryInterface.sequelize.query(`
      UPDATE demande_acces
      SET centre_id = (SELECT centre_id FROM utilisateur WHERE utilisateur.id = demande_acces.utilisateur_id)
      WHERE centre_id IS NULL AND utilisateur_id IS NOT NULL
    `);
    if (centres.length === 1) {
      await queryInterface.sequelize.query(
        'UPDATE demande_acces SET centre_id = :centreId WHERE centre_id IS NULL',
        { replacements: { centreId: centres[0].id } }
      );
    }

    const now = new Date();
    const [existingRoles] = await queryInterface.sequelize.query(
      "SELECT id FROM role WHERE LOWER(REPLACE(libelle, ' ', '_')) = 'super_admin' LIMIT 1"
    );
    if (!existingRoles.length) {
      await queryInterface.bulkInsert('role', [{
        id: SUPER_ADMIN_ROLE_ID,
        libelle: 'Super Admin',
        description: 'Administration globale multi-centres',
        created_at: now,
        updated_at: now,
      }]);
    }
    const superAdminRoleId = existingRoles[0]?.id || SUPER_ADMIN_ROLE_ID;
    const email = String(process.env.SUPER_ADMIN_EMAIL || 'superadmin@camtel.local').toLowerCase();
    const matricule = String(process.env.SUPER_ADMIN_MATRICULE || 'SUP-001');
    const [existingUsers] = await queryInterface.sequelize.query(
      'SELECT id FROM utilisateur WHERE LOWER(email) = LOWER(:email) OR matricule = :matricule LIMIT 1',
      { replacements: { email, matricule } }
    );
    if (!existingUsers.length) {
      const passwordHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Amind123!', 10);
      await queryInterface.bulkInsert('utilisateur', [{
        id: SUPER_ADMIN_USER_ID,
        role_id: superAdminRoleId,
        centre_id: null,
        poste_id: null,
        da_id: null,
        dsm_id: null,
        pos_id: null,
        zone_id: null,
        id_manager: null,
        matricule,
        nom_complet: 'Super Administrateur',
        email,
        telephone: null,
        mot_de_passe: passwordHash,
        must_change_password: true,
        statut: 'actif',
        created_at: now,
        updated_at: now,
      }]);
    } else {
      await queryInterface.sequelize.query(
        'UPDATE utilisateur SET role_id = :roleId, centre_id = NULL WHERE id = :id',
        { replacements: { roleId: superAdminRoleId, id: existingUsers[0].id } }
      );
    }

    const centreIndexes = await indexNames(queryInterface, 'centre');
    if (!centreIndexes.has('centre_code_centre_ci_unique')) {
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX centre_code_centre_ci_unique ON centre (LOWER(code_centre))'
      );
    }
    const userIndexes = await indexNames(queryInterface, 'utilisateur');
    if (!userIndexes.has('utilisateur_centre_id_idx')) {
      await queryInterface.addIndex('utilisateur', ['centre_id'], { name: 'utilisateur_centre_id_idx' });
    }
    const requestIndexes = await indexNames(queryInterface, 'demande_acces');
    if (!requestIndexes.has('demande_acces_centre_id_idx')) {
      await queryInterface.addIndex('demande_acces', ['centre_id'], { name: 'demande_acces_centre_id_idx' });
    }
  },

  async down(queryInterface) {
    const [superAdmins] = await queryInterface.sequelize.query(
      "SELECT u.id FROM utilisateur u JOIN role r ON r.id = u.role_id WHERE LOWER(REPLACE(r.libelle, ' ', '_')) = 'super_admin'"
    );
    if (superAdmins.length) {
      await queryInterface.bulkDelete('utilisateur', { id: superAdmins.map((item) => item.id) });
    }
    await queryInterface.bulkDelete('role', { id: SUPER_ADMIN_ROLE_ID });
    for (const [table, column] of [['demande_acces', 'centre_id'], ['utilisateur', 'centre_id'], ['centre', 'active'], ['centre', 'telephone'], ['centre', 'code_centre']]) {
      if ((await columnNames(queryInterface, table)).includes(column)) {
        await queryInterface.removeColumn(table, column);
      }
    }
  },
};
