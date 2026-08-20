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
    region: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'centre',
    underscored: true,
    timestamps: true
  });

  Centre.associate = function associate(models) {
    Centre.hasMany(models.Da, { foreignKey: 'centre_id', as: 'das' });
  };

  return Centre;
};