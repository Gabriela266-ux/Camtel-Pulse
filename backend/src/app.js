const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const salesRoutes = require('./routes/salesRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const businessRoutes = require('./routes/businessRoutes');
const saisieRoutes = require('./routes/saisieRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const correctionRoutes = require('./routes/correctionRoutes');
const objectifRoutes = require('./routes/objectifRoutes');
const importRoutes = require('./routes/importRoutes');
const accountRoutes = require('./routes/accountRoutes');
const advancedRoutes = require('./routes/advancedRoutes');

dotenv.config();

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
  app.use(helmet());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      ok: true,
      name: 'Camtel Pulse API',
      timestamp: new Date().toISOString(),
      status: 'running'
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/organization', organizationRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/business', businessRoutes);
  app.use('/api/saisies', saisieRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/corrections', correctionRoutes);
  app.use('/api/objectifs', objectifRoutes);
  app.use('/api/import', importRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/advanced', advancedRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
