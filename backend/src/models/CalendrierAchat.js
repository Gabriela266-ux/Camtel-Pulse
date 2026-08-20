// "Calendrier d'Achat" = jargon Camtel pour "Prévisions" (montant que l'opérationnel
// prévoit d'acheter/vendre un jour donné). À ne pas confondre avec "Achat" (réalisation,
// table vente_dsm_au_pos) ni "Stock" (stock physique journalier, table stock).
module.exports = (sequelize, DataTypes) => {
  const CalendrierAchat = sequelize.define('CalendrierAchat', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    dsm_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'dsm', key: 'id' }
    },
    pos_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: { model: 'pos', key: 'id' }
    },
    utilisateur_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'utilisateur', key: 'id' }
    },
    date_prevue: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    quantite_prevue: {
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
    tableName: 'calendrier_achat',
    underscored: true,
    timestamps: true
  });

  CalendrierAchat.associate = function associate(models) {
    CalendrierAchat.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    CalendrierAchat.belongsTo(models.Pos, { foreignKey: 'pos_id', as: 'pos' });
    CalendrierAchat.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'saisi_par' });
  };

  return CalendrierAchat;
};
