module.exports = (sequelize, DataTypes) => {
  const Pos = sequelize.define('Pos', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    dsm_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'dsm',
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
    tableName: 'pos',
    underscored: true,
    timestamps: true
  });

  Pos.associate = function associate(models) {
    Pos.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    Pos.hasMany(models.Utilisateur, { foreignKey: 'pos_id', as: 'utilisateurs' });
  };

  return Pos;
};
