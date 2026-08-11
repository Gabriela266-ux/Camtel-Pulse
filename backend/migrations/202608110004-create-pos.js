module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pos', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      dsm_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'dsm',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      nom: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      objectif_mensuel: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      active: {
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
    await queryInterface.dropTable('pos');
  }
};
