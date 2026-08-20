'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const columns = await queryInterface.describeTable('da');
        if (!columns.region) {
            await queryInterface.addColumn('da', 'region', { type: Sequelize.STRING(100), allowNull: true });
        }
        if (!columns.numero_sim) {
            await queryInterface.addColumn('da', 'numero_sim', { type: Sequelize.STRING(50), allowNull: true });
            await queryInterface.addIndex('da', ['numero_sim'], { unique: true, name: 'da_numero_sim_unique' });
        }
    },

    async down(queryInterface) {
        const columns = await queryInterface.describeTable('da');
        if (columns.numero_sim) await queryInterface.removeColumn('da', 'numero_sim');
        if (columns.region) await queryInterface.removeColumn('da', 'region');
    }
};