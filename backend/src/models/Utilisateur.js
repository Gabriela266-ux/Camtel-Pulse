module.exports = (sequelize, DataTypes) => {
  const Utilisateur = sequelize.define('Utilisateur', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    centre_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'centres',
        key: 'id'
      }
    },
    da_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'da',
        key: 'id'
      }
    },
    dsm_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'dsm',
        key: 'id'
      }
    },
    pos_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'pos',
        key: 'id'
      }
    },
    nom: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    prenom: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'chef_operationnel', 'operational', 'manager'),
      allowNull: false,
      defaultValue: 'operational'
    },
    actif: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'utilisateurs',
    underscored: true,
    timestamps: true
  });

  Utilisateur.associate = function associate(models) {
    Utilisateur.belongsTo(models.Centre, { foreignKey: 'centre_id', as: 'centre' });
    Utilisateur.belongsTo(models.Da, { foreignKey: 'da_id', as: 'da' });
    Utilisateur.belongsTo(models.Dsm, { foreignKey: 'dsm_id', as: 'dsm' });
    Utilisateur.belongsTo(models.Pos, { foreignKey: 'pos_id', as: 'pos' });
  };

  return Utilisateur;
};
