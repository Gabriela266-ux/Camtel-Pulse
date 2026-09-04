module.exports = (sequelize, DataTypes) => {
  const DemandeAcces = sequelize.define('DemandeAcces', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    utilisateur_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'utilisateur', key: 'id' }
    },
    poste_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'poste', key: 'id' }
    },
    role_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: { model: 'role', key: 'id' }
    },
    centre_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'centre', key: 'id' }
    },
    chef_operationnel_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'utilisateur', key: 'id' }
    },
    nom_complet: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    matricule: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    telephone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    statut: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'EN_ATTENTE'
    },
    motif_refus: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    valide_par: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'utilisateur', key: 'id' }
    },
    valide_le: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'demande_acces',
    underscored: true,
    timestamps: true
  });

  DemandeAcces.associate = function associate(models) {
    DemandeAcces.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'user' });
    DemandeAcces.belongsTo(models.Poste, { foreignKey: 'poste_id', as: 'poste' });
    DemandeAcces.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    DemandeAcces.belongsTo(models.Centre, { foreignKey: 'centre_id', as: 'centre' });
    DemandeAcces.belongsTo(models.Utilisateur, { foreignKey: 'chef_operationnel_id', as: 'chefOperationnel' });
    // Administrateur ayant validé / refusé la demande.
    DemandeAcces.belongsTo(models.Utilisateur, { foreignKey: 'valide_par', as: 'validateur' });
  };

  return DemandeAcces;
};
