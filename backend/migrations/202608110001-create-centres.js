module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('centres', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
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
      region: {
        type: Sequelize.STRING(100),
        allowNull: true
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
    await queryInterface.dropTable('centres');
  }
};
