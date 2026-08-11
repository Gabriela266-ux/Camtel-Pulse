module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('utilisateurs', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      centre_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: {
          model: 'centres',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      da_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: {
          model: 'da',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      dsm_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: {
          model: 'dsm',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      pos_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: {
          model: 'pos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      nom: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      prenom: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'chef_operationnel', 'operational', 'manager'),
        allowNull: false,
        defaultValue: 'operational'
      },
      actif: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    await queryInterface.dropTable('utilisateurs');
  }
};
