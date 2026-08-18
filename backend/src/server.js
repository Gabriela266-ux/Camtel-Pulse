const dotenv = require('dotenv');
dotenv.config();

const { createApp } = require('./app');
const { sequelize } = require('./models');

const port = process.env.PORT || 5000;
const app = createApp();

async function startServer() {
  try {
    // Synchroniser les modèles avec la BD
    await sequelize.authenticate();
    console.log('✅ Connexion SQLite réussie');

    // Optionnel: sync models (déjà fait par migrations)
    // await sequelize.sync({ alter: false });

    const server = app.listen(port, () => {
      console.log(`🚀 Camtel Pulse API listening on port ${port}`);
      console.log(`📊 Database: ${process.env.DB_STORAGE || 'camtel_pulse.db'}`);
    });

    // Configure timeouts for large file uploads
    server.setTimeout(300000); // 5 minutes
    server.keepAliveTimeout = 65000; // 65 seconds
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données :', error);
    process.exit(1);
  }
}

startServer();