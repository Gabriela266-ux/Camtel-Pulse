const db = require('./src/models');
const { dsms, pos, centers } = require('./src/data/seedData');

// Disable foreign key constraints for SQLite in test environment
beforeAll(async () => {
  try {
    console.log('[JEST SETUP] Starting database setup for tests...');
    
    // Ensure database is synced
    await db.sequelize.sync({ alter: false });
    
    // Disable foreign key checks temporarily
    await db.sequelize.query('PRAGMA foreign_keys = OFF');
    
    // Clear existing data
    await db.VenteDsmAuPos.destroy({ where: {}, truncate: true, force: true });
    await db.Dsm.destroy({ where: {}, truncate: true, force: true });
    await db.Pos.destroy({ where: {}, truncate: true, force: true });
    await db.Centre.destroy({ where: {}, truncate: true, force: true });
    
    // Insert centers
    if (centers && centers.length > 0) {
      for (const center of centers) {
        await db.Centre.findOrCreate({
          where: { id: center.id },
          defaults: center
        });
      }
      console.log('[JEST SETUP] Centers seeded');
    }
    
    // Insert DSMs
    if (dsms && dsms.length > 0) {
      for (const dsm of dsms) {
        await db.Dsm.findOrCreate({
          where: { id: dsm.id },
          defaults: {
            id: dsm.id,
            client_id: dsm.clientId,
            name: dsm.name,
            objectif_mensuel: dsm.monthlyGoal
          }
        });
      }
      console.log('[JEST SETUP] DSMs seeded');
    }
    
    // Insert POSes
    if (pos && pos.length > 0) {
      for (const p of pos) {
        await db.Pos.findOrCreate({
          where: { id: p.id },
          defaults: {
            id: p.id,
            dsm_id: p.dsmId,
            name: p.name,
            objectif_mensuel: p.monthlyGoal
          }
        });
      }
      console.log('[JEST SETUP] POSes seeded');
    }
    
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
