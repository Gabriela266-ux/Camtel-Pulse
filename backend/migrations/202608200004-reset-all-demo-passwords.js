'use strict';
const bcrypt = require('bcryptjs');

// Réinitialise les 4 comptes de démonstration au même mot de passe connu
// ("Admin123!"), quel que soit ce que les migrations précédentes ont pu
// changer entre-temps. Objectif : plus aucune incertitude avant la démo.
const DEMO_ACCOUNTS = [
  'admin@camtel.local',
  'manager@camtel.local',
  'chef@camtel.local',
  'operateur@camtel.local'
];

module.exports = {
  async up(queryInterface) {
    const hashed = await bcrypt.hash('Admin123!', 10);

    for (const email of DEMO_ACCOUNTS) {
      await queryInterface.bulkUpdate(
        'utilisateur',
        { mot_de_passe: hashed },
        { email }
      );
    }
  },

  async down() {
    // Pas de retour en arrière pertinent.
  }
};