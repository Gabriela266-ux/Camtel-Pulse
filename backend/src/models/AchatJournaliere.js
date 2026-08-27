module.exports = (sequelize, DataTypes) => {
  const AchatJournaliere = sequelize.define('AchatJournaliere', {
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
    dsm_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'dsm', key: 'id' }
    },
    scope_type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'LEGACY'
    },
    utilisateur_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'utilisateur', key: 'id' }
    },
    date_achat: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    montant_achat: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    date_saisir: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'acht_journaliere',
    underscored: true,
    timestamps: true
  });

  AchatJournaliere.associate = function associate(models) {
    AchatJournaliere.belongsTo(models.Da, { foreignKey: 'da_id', as: 'da' });
    AchatJournaliere.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    AchatJournaliere.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'saisi_par' });
  };

  return AchatJournaliere;
};
