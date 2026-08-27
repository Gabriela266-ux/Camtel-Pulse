const db = require('./src/models');

// Disable foreign key constraints for SQLite in test environment
beforeAll(async () => {
  try {
    console.log('[JEST SETUP] Starting database setup for tests...');
    
    // Ensure database is synced
    await db.sequelize.sync({ alter: false });
    
    // Disable foreign key checks temporarily
    await db.sequelize.query('PRAGMA foreign_keys = OFF');
    
    // Clear transactional data only — preserve the seeded network (Pos, Dsm, Da)
    // and referentials (role, utilisateur) that auth & saisie tests rely on.
    const clean = async (model) => {
      if (db[model]) await db[model].destroy({ where: {}, truncate: true, force: true });
    };
    await clean('VenteDsmAuPos');
    await clean('Correction');
    await clean('Stock');

    // Re-enable foreign key checks
    await db.sequelize.query('PRAGMA foreign_keys = ON');
    
    console.log('[JEST SETUP] Database setup completed');
  } catch (error) {
    console.error('[JEST SETUP] Error during database setup:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await db.sequelize.close();
  } catch (error) {
    console.error('[JEST SETUP] Error closing database:', error);
  }
});
