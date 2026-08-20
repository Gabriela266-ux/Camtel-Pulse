const { sequelize } = require('./models');

async function verifyAndSyncDatabase() {
  try {
    console.log('🔄 Démarrage de la synchronisation des 11 modèles...');

    // force: true recrée proprement les tables (attention : écrase les données existantes)
    await sequelize.sync({ force: true });
    console.log('✅ Synchronisation réussie : Aucune erreur de clé étrangère !');

    // Requête SQLite pour vérifier le nombre et le nom des tables créées
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );

    console.log(`\n=== NOMBRE DE TABLES CRÉÉES : ${tables.length} ===`);
    tables.forEach((t, i) => console.log(`${i + 1}. ✓ ${t.name}`));

  } catch (error) {
    console.error('❌ Erreur de synchronisation ou de clés étrangères :', error.message);
  } finally {
    await sequelize.close();
  }
}

verifyAndSyncDatabase();