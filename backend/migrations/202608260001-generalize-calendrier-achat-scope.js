'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const description = await queryInterface.describeTable('calendrier_achat');

    if (!description.da_id) {
      if (dialect === 'sqlite') {
        await queryInterface.sequelize.query(
          'ALTER TABLE `calendrier_achat` ADD COLUMN `da_id` VARCHAR(36)'
        );
      } else {
        await queryInterface.addColumn('calendrier_achat', 'da_id', {
          type: Sequelize.STRING(36),
          allowNull: true,
          references: { model: 'da', key: 'id' }
        });
      }
    }

    if (dialect === 'sqlite') {
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.sequelize.query(
          `CREATE TABLE \`calendrier_achat_scope_mig\` (
            \`id\` VARCHAR(36) PRIMARY KEY NOT NULL,
            \`da_id\` VARCHAR(36) REFERENCES \`da\`(\`id\`),
            \`dsm_id\` VARCHAR(36) REFERENCES \`dsm\`(\`id\`),
            \`pos_id\` VARCHAR(36) REFERENCES \`pos\`(\`id\`),
            \`utilisateur_id\` VARCHAR(36) REFERENCES \`utilisateur\`(\`id\`),
            \`date_prevue\` DATE NOT NULL,
            \`quantite_prevue\` DECIMAL(15, 2) DEFAULT 0,
            \`date_saisir\` DATETIME DEFAULT CURRENT_TIMESTAMP,
            \`created_at\` DATETIME NOT NULL,
            \`updated_at\` DATETIME NOT NULL
          )`, { transaction }
        );

        await queryInterface.sequelize.query(
          `INSERT INTO \`calendrier_achat_scope_mig\`
           SELECT \`id\`, \`da_id\`, \`dsm_id\`, \`pos_id\`, \`utilisateur_id\`,
             \`date_prevue\`, \`quantite_prevue\`, \`date_saisir\`,
             \`created_at\`, \`updated_at\`
           FROM \`calendrier_achat\``, { transaction }
        );

        await queryInterface.dropTable('calendrier_achat', { transaction });
        await queryInterface.renameTable('calendrier_achat_scope_mig', 'calendrier_achat', { transaction });

        await queryInterface.addIndex('calendrier_achat', ['pos_id', 'date_prevue'], {
          name: 'calendrier_achat_pos_date_unique',
          unique: true,
          transaction
        });
      });
      return;
    }

    await queryInterface.changeColumn('calendrier_achat', 'pos_id', {
      type: Sequelize.STRING(36),
      allowNull: true,
      references: { model: 'pos', key: 'id' }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('calendrier_achat', 'da_id');
    await queryInterface.changeColumn('calendrier_achat', 'pos_id', {
      type: Sequelize.STRING(36),
      allowNull: false,
      references: { model: 'pos', key: 'id' }
    });
  }
};
