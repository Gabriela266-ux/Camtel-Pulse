module.exports = (sequelize, DataTypes) => {
  const PrevisionJournaliere = sequelize.define('PrevisionJournaliere', {
    id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    da_id: { type: DataTypes.STRING(36), allowNull: true },
    dsm_id: { type: DataTypes.STRING(36), allowNull: true },
    pos_id: { type: DataTypes.STRING(36), allowNull: true },
    date_prevision: { type: DataTypes.DATEONLY, allowNull: false },
    montant_prevision: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    statut: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'brouillon' }
  }, { tableName: 'prevision_journaliere', underscored: true, timestamps: true });

  PrevisionJournaliere.associate = (models) => {
    PrevisionJournaliere.belongsTo(models.Da, { foreignKey: 'da_id', as: 'da' });
    PrevisionJournaliere.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    PrevisionJournaliere.belongsTo(models.Pos, { foreignKey: 'pos_id', as: 'pos' });
  };
  return PrevisionJournaliere;
};
