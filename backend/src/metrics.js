'use strict';

const client = require('prom-client');

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: 'camtel_pulse_' });

const httpRequests = new client.Counter({
  name: 'camtel_pulse_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});
const httpDuration = new client.Histogram({
  name: 'camtel_pulse_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

function middleware(req, res, next) {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const route = req.route?.path || req.path || 'unknown';
    const labels = { method: req.method, route, status: String(res.statusCode) };
    httpRequests.inc(labels);
    httpDuration.observe(labels, Number(process.hrtime.bigint() - started) / 1e9);
  });
  next();
}

async function metricsHandler(_req, res) {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}

module.exports = { middleware, metricsHandler, registry };
