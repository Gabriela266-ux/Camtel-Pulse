module.exports = (sequelize, DataTypes) => {
  const Poste = sequelize.define('Poste', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    libelle: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    role_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: { model: 'role', key: 'id' }
    }
  }, {
    tableName: 'poste',
    underscored: true,
    timestamps: true
  });

  Poste.associate = function associate(models) {
    // Le rôle est toujours déduit du poste (jamais saisi manuellement).
    Poste.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    Poste.hasMany(models.Utilisateur, { foreignKey: 'poste_id', as: 'utilisateurs' });
    Poste.hasMany(models.DemandeAcces, { foreignKey: 'poste_id', as: 'demandes' });
  };

  return Poste;
};