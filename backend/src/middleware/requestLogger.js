const crypto = require('crypto');
const logger = require('../utils/logger');
const { httpRequestsTotal, httpRequestDuration } = require('../utils/metrics');

// probes and scrapes would drown out real traffic
const QUIET_PATHS = ['/health', '/health/live', '/health/ready', '/metrics'];

module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  res.on('finish', () => {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    // use the matched route pattern (/api/posts/:id) so label cardinality stays bounded; requests
    // answered before routing (404s, rate-limited 429s, static docs) must never leak raw URLs
    const route = req.route ? (req.routeBase || '') + req.route.path : 'unmatched';
    const labels = { method: req.method, route, status: res.statusCode };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, seconds);

    if (QUIET_PATHS.includes(req.path)) return;

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, 'request', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      route,
      status: res.statusCode,
      duration_ms: Math.round(seconds * 1000),
      userId: req.user?.userId,
    });
  });

  next();
};
