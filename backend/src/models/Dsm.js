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
      references: { model: 'da', key: 'id' }
    },
    zone_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'zone', key: 'id' }
    },
    nom: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    raison_sociale: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    adresse: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contact: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    statut: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'actif'
    },
    date_adhesion: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'dsm',
    underscored: true,
    timestamps: true
  });

  Dsm.associate = function associate(models) {
    Dsm.belongsTo(models.Da, { foreignKey: 'da_id', as: 'da' });
    Dsm.belongsTo(models.Zone, { foreignKey: 'zone_id', as: 'zone' });
    Dsm.hasMany(models.Pos, { foreignKey: 'dsm_id', as: 'pos_list' });
    Dsm.hasMany(models.VenteDsmAuPos, { foreignKey: 'dsm_id', as: 'ventes' });
    Dsm.hasMany(models.Stock, { foreignKey: 'dsm_id', as: 'stocks' });
  };

  return Dsm;
};