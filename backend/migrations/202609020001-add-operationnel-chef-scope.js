'use strict';

async function columnNames(queryInterface, tableName) {
  return Object.keys(await queryInterface.describeTable(tableName));
}

async function indexNames(queryInterface, tableName) {
  return new Set((await queryInterface.showIndex(tableName)).map((index) => index.name));
}

function normalizeRole(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await columnNames(queryInterface, 'demande_acces')).includes('chef_operationnel_id')) {
      await queryInterface.addColumn('demande_acces', 'chef_operationnel_id', {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: { model: 'utilisateur', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    const [roles] = await queryInterface.sequelize.query('SELECT id, libelle FROM role');
    const operationnelRoleIds = roles
      .filter((role) => normalizeRole(role.libelle) === 'operationnel')
      .map((role) => role.id);
    const chefRoleIds = roles
      .filter((role) => normalizeRole(role.libelle) === 'chef_operationnel')
      .map((role) => role.id);

    if (operationnelRoleIds.length && chefRoleIds.length) {
      const [centres] = await queryInterface.sequelize.query('SELECT id FROM centre');
      for (const centre of centres) {
        const [chefs] = await queryInterface.sequelize.query(
          `SELECT id FROM utilisateur
           WHERE centre_id = :centreId AND role_id IN (:chefRoleIds) AND statut = 'actif'
           ORDER BY created_at, id`,
          { replacements: { centreId: centre.id, chefRoleIds } }
        );
        // Aucun choix arbitraire lorsqu'un centre possède plusieurs Chefs.
        if (chefs.length !== 1) continue;
        await queryInterface.sequelize.query(
          `UPDATE utilisateur
           SET id_manager = :chefId
           WHERE centre_id = :centreId
             AND role_id IN (:operationnelRoleIds)
             AND id_manager IS NULL`,
          { replacements: { chefId: chefs[0].id, centreId: centre.id, operationnelRoleIds } }
        );
      }
    }

    const requestIndexes = await indexNames(queryInterface, 'demande_acces');
    if (!requestIndexes.has('demande_acces_chef_operationnel_id_idx')) {
      await queryInterface.addIndex('demande_acces', ['chef_operationnel_id'], {
        name: 'demande_acces_chef_operationnel_id_idx',
      });
    }
    const userIndexes = await indexNames(queryInterface, 'utilisateur');
    if (!userIndexes.has('utilisateur_id_manager_idx')) {
      await queryInterface.addIndex('utilisateur', ['id_manager'], {
        name: 'utilisateur_id_manager_idx',
      });
    }
  },

  async down(queryInterface) {
    const requestIndexes = await indexNames(queryInterface, 'demande_acces');
    if (requestIndexes.has('demande_acces_chef_operationnel_id_idx')) {
      await queryInterface.removeIndex('demande_acces', 'demande_acces_chef_operationnel_id_idx');
    }
    if ((await columnNames(queryInterface, 'demande_acces')).includes('chef_operationnel_id')) {
      await queryInterface.removeColumn('demande_acces', 'chef_operationnel_id');
    }
  },
};
