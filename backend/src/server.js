const app = require('./app');
const logger = require('./utils/logger');
const { pool } = require('./utils/db');
const { migrate } = require('../database/migrate');

const PORT = process.env.PORT || 3000;

async function start() {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is not set — refusing to start');
    process.exit(1);
  }

  // run pending SQL migrations before taking traffic (no separate release step needed; an advisory lock serialises replicas)
  if (process.env.RUN_MIGRATIONS !== 'false') {
    await migrate();
  }

  const server = app.listen(PORT, () => {
    logger.info('BlogFlow API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  });

  // let in-flight requests finish when the orchestrator stops the container
  const shutdown = (signal) => {
    logger.info('Shutting down', { signal });
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  logger.error('Startup failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
