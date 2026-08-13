module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    libelle: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'role',
    underscored: true,
    timestamps: true
  });

  Role.associate = function associate(models) {
    Role.hasMany(models.Utilisateur, { foreignKey: 'role_id', as: 'utilisateurs' });
  };

  return Role;
};