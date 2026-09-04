const dotenv = require('dotenv');
dotenv.config();

const { createApp } = require('./app');
const { sequelize } = require('./models');
const redis = require('./config/redis');
const http = require('http');
const { createRealtimeServer } = require('./realtime');

const port = process.env.PORT || 5000;
const app = createApp();

async function startServer() {
  try {
    // Synchroniser les modèles avec la BD
    await sequelize.authenticate();
    await redis.connect();
    console.log(`✅ Connexion base de données réussie (${process.env.DB_DIALECT || 'sqlite'})`);
    console.log(`🧠 Redis: ${redis.status().enabled ? 'activé' : 'désactivé'}`);

    // Optionnel: sync models (déjà fait par migrations)
    // await sequelize.sync({ alter: false });

    const server = http.createServer(app);
    await createRealtimeServer(server);
    server.listen(port, () => {
      console.log(`🚀 Camtel Pulse API listening on port ${port}`);
      console.log(`📊 Database: ${process.env.DB_STORAGE || 'camtel_pulse.db'}`);
    });

    // Configure timeouts for large file uploads
    server.setTimeout(300000); // 5 minutes
    server.keepAliveTimeout = 65000; // 65 seconds

    const shutdown = async (signal) => {
      console.log(`🛑 ${signal}: arrêt de l'instance`);
      server.close(async () => {
        await redis.close();
        await sequelize.close();
        process.exit(0);
      });
    };
    process.once('SIGTERM', () => void shutdown('SIGTERM'));
    process.once('SIGINT', () => void shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données :', error);
    process.exit(1);
  }
}

startServer();