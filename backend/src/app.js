const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
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
const redis = require('./config/redis');
const { apiRateLimit } = require('./middlewares/security');
const metrics = require('./metrics');

dotenv.config();

function createApp() {
  const app = express();
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));
  app.use((req, res, next) => {
    const timeoutMs = req.path.startsWith('/api/import')
      ? Number(process.env.IMPORT_TIMEOUT_MS || 300000)
      : Number(process.env.REQUEST_TIMEOUT_MS || 30000);
    req.setTimeout(timeoutMs);
    res.setTimeout(timeoutMs);
    next();
  });

  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
  app.use(helmet());
  app.use(compression());
  app.use(apiRateLimit);
  app.use(metrics.middleware);
  app.use(morgan((tokens, req, res) => JSON.stringify({
    level: 'info',
    method: tokens.method(req, res),
    path: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    durationMs: Number(tokens['response-time'](req, res)),
  })));
  app.use('/api/import', express.json({ limit: process.env.IMPORT_JSON_LIMIT || '10mb' }), importRoutes);
  app.use(express.json({ limit: process.env.JSON_LIMIT || '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_LIMIT || '1mb' }));

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
      status: 'running',
      redis: redis.status()
    });
  });
  app.get('/api/metrics', metrics.metricsHandler);

  // Alias attendu par le frontend (voir api/services.ts) : hiérarchie
  // du centre de l'utilisateur connecté, reformatée pour la Sidebar.
  app.get('/api/hierarchie', authenticate, async (req, res, next) => {
    try {
      const requestedCenterId = ['super_admin', 'manager'].includes(req.user.role) && req.query.centerId
        ? String(req.query.centerId)
        : ['super_admin', 'manager'].includes(req.user.role) ? null : req.user.centerId;
      if (!requestedCenterId && !['manager'].includes(req.user.role)) {
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
