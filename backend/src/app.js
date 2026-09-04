const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { errorHandler } = require('./middlewares/errorHandler');
const { authenticate } = require('./middlewares/authMiddleware');
const organizationService = require('./services/organizationService');
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
const calendrierAchatRoutes = require('./routes/calendrierAchatRoutes');
const previsionRoutes = require('./routes/previsionRoutes');
const operationnelRoutes = require('./routes/operationnelRoutes');
const snapshotRoutes = require('./routes/snapshotRoutes');
const centreRoutes = require('./routes/centreRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

dotenv.config();

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
  app.use(helmet());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan('dev'));

  // The API is normally consumed through the Vite frontend, but opening the
  // backend URL directly should not produce Express' default "Cannot GET /".
  app.get('/', (req, res) => {
    res.status(200).json({
      ok: true,
      name: 'Camtel Pulse API',
      status: 'running',
      health: '/api/health'
    });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      ok: true,
      name: 'Camtel Pulse API',
      timestamp: new Date().toISOString(),
      status: 'running'
    });
  });

  // Alias attendu par le frontend (voir api/services.ts) : hiérarchie
  // du centre de l'utilisateur connecté, reformatée pour la Sidebar.
  app.get('/api/hierarchie', authenticate, async (req, res, next) => {
    try {
      const requestedCenterId = req.user.role === 'super_admin' && req.query.centerId
        ? String(req.query.centerId)
        : req.user.centerId;
      if (!requestedCenterId) {
        return res.status(400).json({ ok: false, message: 'Sélectionnez un centre.' });
      }
      const data = await organizationService.getFrontendHierarchy(requestedCenterId);
      if (!data) return res.status(404).json({ ok: false, message: 'Centre introuvable' });
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/centres', centreRoutes);
  app.use('/api/super-admin', superAdminRoutes);
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
  app.use('/api/calendrier-achat', calendrierAchatRoutes);
  app.use('/api/previsions', previsionRoutes);

  // Endpoints console d'administration & vue Chef opérationnel.
  // GET /api/operationnels · GET /api/affectations · POST /api/partenaires · PATCH /api/affectations/:userId
  app.use('/api', operationnelRoutes);
  app.use('/api/snapshots', snapshotRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({ ok: false, message: `Route API introuvable: ${req.method} ${req.originalUrl}` });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
