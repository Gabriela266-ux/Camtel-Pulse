module.exports = (sequelize, DataTypes) => {
  const Centre = sequelize.define('Centre', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    nom_centre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    code_centre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    telephone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'centre',
    underscored: true,
    timestamps: true
  });

  Centre.associate = function associate(models) {
    Centre.hasMany(models.Da, { foreignKey: 'centre_id', as: 'das' });
    Centre.hasMany(models.Utilisateur, { foreignKey: 'centre_id', as: 'utilisateurs' });
    Centre.hasMany(models.DemandeAcces, { foreignKey: 'centre_id', as: 'demandesAcces' });
  };

  return Centre;
};
