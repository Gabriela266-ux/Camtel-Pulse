module.exports = (sequelize, DataTypes) => {
  const AffectationOperationnelPartenaire = sequelize.define('AffectationOperationnelPartenaire', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    utilisateur_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: { model: 'utilisateur', key: 'id' }
    },
    da_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: { model: 'da', key: 'id' }
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'actif'
    },
    affecte_par: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'utilisateur', key: 'id' }
    }
  }, {
    tableName: 'affectation_operationnel_partenaire',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['utilisateur_id', 'da_id'] },
      { fields: ['da_id', 'statut'] }
    ]
  });

  AffectationOperationnelPartenaire.associate = function associate(models) {
    AffectationOperationnelPartenaire.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'operationnel'
    });
    AffectationOperationnelPartenaire.belongsTo(models.Da, {
      foreignKey: 'da_id',
      as: 'partenaire'
    });
    AffectationOperationnelPartenaire.belongsTo(models.Utilisateur, {
      foreignKey: 'affecte_par',
      as: 'chefAffectation'
    });
  };

  return AffectationOperationnelPartenaire;
};
