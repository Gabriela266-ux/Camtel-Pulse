module.exports = (sequelize, DataTypes) => {
  const Centre = sequelize.define('Centre', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    nom: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'centres',
    underscored: true,
    timestamps: true
  });

  Centre.associate = function associate(models) {
    Centre.hasMany(models.Da, { foreignKey: 'centre_id', as: 'das' });
    Centre.hasMany(models.Utilisateur, { foreignKey: 'centre_id', as: 'utilisateurs' });
  };

  return Centre;
};
