module.exports = (sequelize, DataTypes) => {
  const ObjectifMensuel = sequelize.define('ObjectifMensuel', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
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
    annee: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mois: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    montant_objectif: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    statut: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'en_cours'
    }
  }, {
    tableName: 'objectif_mensuel',
    underscored: true,
    timestamps: true
  });

  ObjectifMensuel.associate = function associate(models) {
    ObjectifMensuel.belongsTo(models.Da, { foreignKey: 'da_id', as: 'da' });
    ObjectifMensuel.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    ObjectifMensuel.belongsTo(models.Pos, { foreignKey: 'pos_id', as: 'pos' });
  };

  return ObjectifMensuel;
};