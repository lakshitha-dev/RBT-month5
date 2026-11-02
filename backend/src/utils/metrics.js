const client = require('prom-client');
const { pool } = require('./db');

const register = new client.Registry();
register.setDefaultLabels({ app: 'blogflow-api' });

// process CPU, memory, event loop lag, GC...
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// read the pool counters at scrape time
new client.Gauge({
  name: 'db_pool_connections',
  help: 'pg pool connections by state',
  labelNames: ['state'],
  registers: [register],
  collect() {
    this.set({ state: 'total' }, pool.totalCount);
    this.set({ state: 'idle' }, pool.idleCount);
    this.set({ state: 'waiting' }, pool.waitingCount);
  },
});

module.exports = { register, httpRequestsTotal, httpRequestDuration };
