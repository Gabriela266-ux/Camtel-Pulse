module.exports = (sequelize, DataTypes) => {
  const VenteDsmAuPos = sequelize.define('VenteDsmAuPos', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    dsm_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
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
    date_vente: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    quantite_vendu: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    montant: {
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
    tableName: 'vente_dsm_au_pos',
    underscored: true,
    timestamps: true
  });

  VenteDsmAuPos.associate = function associate(models) {
    VenteDsmAuPos.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    VenteDsmAuPos.belongsTo(models.Pos, { foreignKey: 'pos_id', as: 'pos' });
    VenteDsmAuPos.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'saisi_par' });
  };

  return VenteDsmAuPos;
};