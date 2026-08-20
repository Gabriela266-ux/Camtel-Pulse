'use strict';

module.exports = {
    async up(queryInterface) {
        const [partners] = await queryInterface.sequelize.query(
            'SELECT da.id, da.region, da.numero_sim, centre.region AS centre_region FROM da LEFT JOIN centre ON centre.id = da.centre_id'
        );

        for (const [index, partner] of partners.entries()) {
            const updates = {};
            if (!partner.region) updates.region = partner.centre_region || 'Non renseignée';
            if (!partner.numero_sim) updates.numero_sim = `237690000${String(index + 1).padStart(3, '0')}`;
            if (Object.keys(updates).length > 0) {
                await queryInterface.bulkUpdate('da', updates, { id: partner.id });
            }
        }
    },

    async down() {}
};