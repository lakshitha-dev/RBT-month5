process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/utils/db', () => ({
  query: jest.fn(),
  pool: { totalCount: 2, idleCount: 1, waitingCount: 0 },
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { query } = require('../src/utils/db');
const app = require('../src/app');

beforeEach(() => query.mockReset());

describe('health endpoints', () => {
  test('GET /health reports healthy when the DB answers', async () => {
    query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.checks.database.status).toBe('up');
    expect(res.body.checks.memory.rss).toBeGreaterThan(0);
  });

  test('GET /health returns 503 when the DB is down', async () => {
    query.mockRejectedValueOnce(new Error('connection refused'));
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
  });

  test('GET /health/live never touches the DB', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(query).not.toHaveBeenCalled();
  });

  test('GET /health/ready reflects DB state', async () => {
    query.mockRejectedValueOnce(new Error('down'));
    expect((await request(app).get('/health/ready')).status).toBe(503);
  });
});

describe('metrics', () => {
  test('GET /metrics exposes Prometheus metrics', async () => {
    await request(app).get('/health/live');
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds_bucket');
    expect(res.text).toContain('db_pool_connections{state="total"');
  });

  test('route label uses the pattern, never the raw URL', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    await request(app).get('/api/posts/12345');
    await request(app).get('/api/no-such-thing/987');
    const { text } = await request(app).get('/metrics');
    expect(text).toContain('route="/api/posts/:id"');
    expect(text).toContain('route="unmatched"');
    expect(text).not.toMatch(/route="[^"]*(12345|987)/);
  });

  test('GET /metrics requires the token when METRICS_TOKEN is set', async () => {
    process.env.METRICS_TOKEN = 'scrape-me';
    try {
      expect((await request(app).get('/metrics')).status).toBe(401);
      const ok = await request(app).get('/metrics').set('Authorization', 'Bearer scrape-me');
      expect(ok.status).toBe(200);
    } finally {
      delete process.env.METRICS_TOKEN;
    }
  });
});

describe('posts API', () => {
  test('GET /api/posts returns paginated posts', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Hello' }] });
    const res = await request(app).get('/api/posts?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['x-request-id']).toBeDefined();
  });

  test('POST /api/posts without a token is 401', async () => {
    const res = await request(app).post('/api/posts').send({ title: 't', content: 'c' });
    expect(res.status).toBe(401);
  });

  test('POST /api/posts validates the body', async () => {
    const token = jwt.sign({ userId: 1, email: 'a@b.c' }, process.env.JWT_SECRET);
    const res = await request(app).post('/api/posts').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(422);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('auth API', () => {
  test('register rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'nope', password: 'secret1', name: 'X' });
    expect(res.status).toBe(422);
  });

  test('login with unknown email is 401', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({ email: 'x@example.com', password: 'whatever' });
    expect(res.status).toBe(401);
  });
});

test('unknown route is a JSON 404', async () => {
  const res = await request(app).get('/api/nope');
  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe('NOT_FOUND');
});
