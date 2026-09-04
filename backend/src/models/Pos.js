module.exports = (sequelize, DataTypes) => {
  const Pos = sequelize.define('Pos', {
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
    zone_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'zone', key: 'id' }
    },
    nom: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    numero_telephone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    code_pos: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    code_dsm: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    code_zone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    nom_reseau: {
      type: DataTypes.VIRTUAL,
      get() {
        const numero = this.getDataValue('numero_telephone');
        const codePos = this.getDataValue('code_pos');
        const codeDsm = this.getDataValue('code_dsm');
        const codeZone = this.getDataValue('code_zone');
        const code = codePos && codeDsm && codeZone ? `${codePos}_${codeDsm}_${codeZone}` : '';
        return numero && code ? `${numero} - ${code}` : this.getDataValue('nom');
      }
    },
    raison_sociale: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    adresse: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contact: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    statut: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'actif'
    },
    date_adhesion: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'pos',
    underscored: true,
    timestamps: true
  });

  Pos.associate = function associate(models) {
    Pos.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    Pos.belongsTo(models.Zone, { foreignKey: 'zone_id', as: 'zone' });
    Pos.hasMany(models.VenteDsmAuPos, { foreignKey: 'pos_id', as: 'achats' });
    Pos.hasMany(models.Stock, { foreignKey: 'pos_id', as: 'stocks' });
  };

  return Pos;
};
