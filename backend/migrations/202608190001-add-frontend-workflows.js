'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const hasTable = (name) => tables.some((table) => String(table).toLowerCase() === name);

    if (!hasTable('utilisateur')) {
      throw new Error('La table utilisateur doit exister avant cette migration');
    }

    const userColumns = await queryInterface.describeTable('utilisateur');
    if (!userColumns.dsm_id) {
      await queryInterface.addColumn('utilisateur', 'dsm_id', {
        type: Sequelize.STRING(36), allowNull: true,
        references: { model: 'dsm', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL'
      });
    }
    if (!userColumns.pos_id) {
      await queryInterface.addColumn('utilisateur', 'pos_id', {
        type: Sequelize.STRING(36), allowNull: true,
        references: { model: 'pos', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL'
      });
    }

    if (!hasTable('prevision_journaliere')) {
      await queryInterface.createTable('prevision_journaliere', {
        id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        da_id: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'da', key: 'id' } },
        dsm_id: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'dsm', key: 'id' } },
        pos_id: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'pos', key: 'id' } },
        date_prevision: { type: Sequelize.DATEONLY, allowNull: false },
        montant_prevision: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        statut: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'brouillon' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
      await queryInterface.addIndex('prevision_journaliere', ['pos_id', 'date_prevision'], { unique: true });
    }

    if (!hasTable('correction')) {
      await queryInterface.createTable('correction', {
        id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        vente_id: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'vente_dsm_au_pos', key: 'id' } },
        pos_id: { type: Sequelize.STRING(36), allowNull: false, references: { model: 'pos', key: 'id' } },
        utilisateur_id: { type: Sequelize.STRING(36), allowNull: false, references: { model: 'utilisateur', key: 'id' } },
        date_vente: { type: Sequelize.DATEONLY, allowNull: false },
        ancienne_valeur: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        nouvelle_valeur: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        motif: { type: Sequelize.TEXT, allowNull: false },
        statut: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'en_attente' },
        valide_par: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'utilisateur', key: 'id' } },
        valide_le: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
    }

    if (!hasTable('audit_log')) {
      await queryInterface.createTable('audit_log', {
        id: { type: Sequelize.STRING(36), primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        utilisateur_id: { type: Sequelize.STRING(36), allowNull: true, references: { model: 'utilisateur', key: 'id' } },
        action: { type: Sequelize.STRING(100), allowNull: false },
        entite: { type: Sequelize.STRING(100), allowNull: true },
        entite_id: { type: Sequelize.STRING(36), allowNull: true },
        details: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const hasTable = (name) => tables.some((table) => String(table).toLowerCase() === name);
    if (hasTable('audit_log')) await queryInterface.dropTable('audit_log');
    if (hasTable('correction')) await queryInterface.dropTable('correction');
    if (hasTable('prevision_journaliere')) await queryInterface.dropTable('prevision_journaliere');
    const userColumns = await queryInterface.describeTable('utilisateur');
    if (userColumns.pos_id) await queryInterface.removeColumn('utilisateur', 'pos_id');
    if (userColumns.dsm_id) await queryInterface.removeColumn('utilisateur', 'dsm_id');
  }
};
