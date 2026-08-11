module.exports = (sequelize, DataTypes) => {
  const Dsm = sequelize.define('Dsm', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    da_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'da',
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
    tableName: 'dsm',
    underscored: true,
    timestamps: true
  });

  Dsm.associate = function associate(models) {
    Dsm.belongsTo(models.Da, { foreignKey: 'da_id', as: 'da' });
    Dsm.hasMany(models.Pos, { foreignKey: 'dsm_id', as: 'pos' });
    Dsm.hasMany(models.Utilisateur, { foreignKey: 'dsm_id', as: 'utilisateurs' });
  };

  return Dsm;
};
