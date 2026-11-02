const router = require('express').Router();
const { query } = require('../utils/db');
const { register } = require('../utils/metrics');

async function checkDatabase() {
  const start = Date.now();
  try {
    await query('SELECT 1');
    return { status: 'up', latency_ms: Date.now() - start };
  } catch (err) {
    return { status: 'down', error: err.message };
  }
}

// full report — 503 when the DB is unreachable so uptime checks catch it
router.get('/health', async (req, res) => {
  const database = await checkDatabase();
  const healthy = database.status === 'up';
  const { rss, heapUsed, heapTotal } = process.memoryUsage();

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || 'dev',
    checks: {
      database,
      memory: { rss, heapUsed, heapTotal },
    },
  });
});

// liveness: the process is up and serving — never touches the DB
router.get('/health/live', (req, res) => res.json({ status: 'ok' }));

// readiness: safe to route traffic here
router.get('/health/ready', async (req, res) => {
  const database = await checkDatabase();
  res.status(database.status === 'up' ? 200 : 503).json({ status: database.status === 'up' ? 'ready' : 'not_ready', database });
});

router.get('/metrics', async (req, res) => {
  const token = process.env.METRICS_TOKEN;
  if (token && req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid metrics token' } });
  }
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

module.exports = router;
