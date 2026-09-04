'use strict';

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const redis = require('../config/redis');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const apiStore = redis.rateLimitStore('camtel:rate-limit:api:');
const userStore = redis.rateLimitStore('camtel:rate-limit:user:');

const apiRateLimit = rateLimit({
  windowMs,
  limit: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, message: 'Trop de requêtes. Réessayez dans un instant.' },
  ...(apiStore ? { store: apiStore } : {}),
});

const userRateLimit = rateLimit({
  windowMs,
  limit: Number(process.env.RATE_LIMIT_USER_MAX || 120),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip)}`,
  message: { ok: false, message: 'Limite utilisateur atteinte. Réessayez dans un instant.' },
  ...(userStore ? { store: userStore } : {}),
});

module.exports = { apiRateLimit, userRateLimit };
