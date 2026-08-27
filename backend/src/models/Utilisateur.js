module.exports = (sequelize, DataTypes) => {
  const Utilisateur = sequelize.define('Utilisateur', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    role_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: { model: 'role', key: 'id' }
    },
    poste_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'poste', key: 'id' }
    },
    da_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'da', key: 'id' }
    },
    dsm_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'dsm', key: 'id' }
    },
    pos_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'pos', key: 'id' }
    },
    zone_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'zone', key: 'id' }
    },
    id_manager: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'utilisateur', key: 'id' }
    },
    matricule: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    nom_complet: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    telephone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    mot_de_passe: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    must_change_password: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    statut: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'actif'
    },
    derniere_connexion: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'utilisateur',
    underscored: true,
    timestamps: true
  });

  Utilisateur.associate = function associate(models) {
    Utilisateur.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    Utilisateur.belongsTo(models.Poste, { foreignKey: 'poste_id', as: 'poste' });
    Utilisateur.belongsTo(models.Da, { foreignKey: 'da_id', as: 'da' });
    Utilisateur.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    Utilisateur.belongsTo(models.Pos, { foreignKey: 'pos_id', as: 'pos' });
    Utilisateur.belongsTo(models.Zone, { foreignKey: 'zone_id', as: 'zone' });
    Utilisateur.belongsTo(models.Utilisateur, { foreignKey: 'id_manager', as: 'manager' });
    Utilisateur.hasMany(models.DemandeAcces, { foreignKey: 'utilisateur_id', as: 'demandesAcces' });
    Utilisateur.hasMany(models.DemandeAcces, { foreignKey: 'valide_par', as: 'demandesValidees' });
  };

  return Utilisateur;
};
