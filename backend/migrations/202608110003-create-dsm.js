module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('dsm', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      da_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'da',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      zone_id: {  // ✅ AJOUTER
        type: Sequelize.STRING(36),
        allowNull: true,
        references: {
          model: 'zone',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      nom: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      raison_sociale: {  // ✅ AJOUTER
        type: Sequelize.STRING(150),
        allowNull: true
      },
      adresse: {  // ✅ AJOUTER
        type: Sequelize.STRING(255),
        allowNull: true
      },
      contact: {  // ✅ AJOUTER
        type: Sequelize.STRING(50),
        allowNull: true
      },
      statut: {  // ✅ RENOMMER DE: active
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'actif'
      },
      date_adhesion: {  // ✅ AJOUTER
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('dsm');
  }
};