module.exports = (sequelize, DataTypes) => sequelize.define('AuditLog', {
  id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  utilisateur_id: { type: DataTypes.STRING(36), allowNull: true },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entite: { type: DataTypes.STRING(100), allowNull: true },
  entite_id: { type: DataTypes.STRING(36), allowNull: true },
  details: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'audit_log', underscored: true, timestamps: true });
