'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
    async up(queryInterface) {
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        await queryInterface.bulkUpdate(
            'utilisateur', { mot_de_passe: hashedPassword }, { email: 'chef@camtel.local' }
        );
    },

    async down(queryInterface) {
        const hashedPassword = await bcrypt.hash('password123', 10);

        await queryInterface.bulkUpdate(
            'utilisateur', { mot_de_passe: hashedPassword }, { email: 'chef@camtel.local' }
        );
    }
};