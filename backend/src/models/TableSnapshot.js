module.exports = function defineTableSnapshot(sequelize, DataTypes) {
    const TableSnapshot = sequelize.define('TableSnapshot', {
        id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        entite_type: { type: DataTypes.STRING(10), allowNull: false },
        entite_id: { type: DataTypes.STRING(36), allowNull: false },
        entite_nom: { type: DataTypes.STRING(150), allowNull: true },
        periode: { type: DataTypes.STRING(7), allowNull: false },
        lignes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        payload: { type: DataTypes.TEXT, allowNull: false },
        total_stock: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        total_prevision: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        total_achat: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        cumul_achat_final: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        created_by: { type: DataTypes.STRING(36), allowNull: true }
    }, {
        tableName: 'table_snapshot',
        underscored: true,
        timestamps: true
    });

    TableSnapshot.associate = function associate(models) {
        TableSnapshot.belongsTo(models.Utilisateur, { foreignKey: 'created_by', as: 'auteur' });
    };

    return TableSnapshot;
};