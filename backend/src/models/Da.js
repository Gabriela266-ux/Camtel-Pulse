module.exports = (sequelize, DataTypes) => {
  const Da = sequelize.define('Da', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    centre_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'centre',
        key: 'id'
      }
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
    objectif_mensuel: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'da',
    underscored: true,
    timestamps: true
  });

  Da.associate = function associate(models) {
    Da.belongsTo(models.Centre, { foreignKey: 'centre_id', as: 'centre' });
    Da.hasMany(models.Dsm, { foreignKey: 'da_id', as: 'dsms' });
    Da.hasMany(models.Utilisateur, { foreignKey: 'da_id', as: 'utilisateurs' });
  };

  return Da;
};
