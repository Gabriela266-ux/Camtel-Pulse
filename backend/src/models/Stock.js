module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define('Stock', {
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
    utilisateur_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'utilisateur', key: 'id' }
    },
    date_stock: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    quantite_credit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    statut: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'disponible'
    },
    date_saisir: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'stock',
    underscored: true,
    timestamps: true
  });

  Stock.associate = function associate(models) {
    Stock.belongsTo(models.Da, { foreignKey: 'da_id', as: 'da' });
    Stock.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    Stock.belongsTo(models.Pos, { foreignKey: 'pos_id', as: 'pos' });
    Stock.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'saisi_par' });
  };

  return Stock;
};
