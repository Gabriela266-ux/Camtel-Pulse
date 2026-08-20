module.exports = (sequelize, DataTypes) => {
  const Correction = sequelize.define('Correction', {
    id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    vente_id: { type: DataTypes.STRING(36), allowNull: true },
    pos_id: { type: DataTypes.STRING(36), allowNull: false },
    utilisateur_id: { type: DataTypes.STRING(36), allowNull: false },
    date_vente: { type: DataTypes.DATEONLY, allowNull: false },
    ancienne_valeur: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    nouvelle_valeur: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    motif: { type: DataTypes.TEXT, allowNull: false },
    statut: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'en_attente' },
    valide_par: { type: DataTypes.STRING(36), allowNull: true },
    valide_le: { type: DataTypes.DATE, allowNull: true }
  }, { tableName: 'correction', underscored: true, timestamps: true });
  return Correction;
};
