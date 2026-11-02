const { Pool } = require('pg');
const logger = require('./logger');

// DATABASE_URL (Render, compose) wins; the DB_* vars keep the Month 2 local setup working
const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'blogflow',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool({
  ...connection,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// an idle client erroring (e.g. DB restart) shouldn't kill the process — the pool replaces it
pool.on('error', (err) => {
  logger.error('Unexpected DB pool error', { error: err.message });
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
