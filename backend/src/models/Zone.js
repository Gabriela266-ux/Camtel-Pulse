module.exports = (sequelize, DataTypes) => {
  const Zone = sequelize.define('Zone', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    nom_zone: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'zone',
    underscored: true,
    timestamps: true
  });

  Zone.associate = function associate(models) {
    Zone.hasMany(models.Dsm, { foreignKey: 'zone_id', as: 'dsms' });
    Zone.hasMany(models.Pos, { foreignKey: 'zone_id', as: 'pos_list' });
    Zone.hasMany(models.Utilisateur, { foreignKey: 'zone_id', as: 'utilisateurs' });
  };

  return Zone;
};