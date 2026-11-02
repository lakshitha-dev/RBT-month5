// End-to-end against a real Postgres. Runs in CI (service container) or locally when
// DATABASE_URL is set; skipped otherwise so `npm test` works without a database.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

// app boot + migrations + bcrypt hashing can exceed Jest's 5s default on slow CI runners
jest.setTimeout(30000);

describeIfDb('integration: register → login → create post', () => {
  let request, app, pool;
  const email = `ci-${Date.now()}@example.com`;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-secret';
    request = require('supertest');
    app = require('../src/app');
    ({ pool } = require('../src/utils/db'));
    await require('../database/migrate').migrate();
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    await pool.end();
  });

  test('health reports the database up', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.checks.database.status).toBe('up');
  });

  test('full author flow', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'secret123', name: 'CI Bot' });
    expect(reg.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'secret123' });
    expect(login.status).toBe(200);
    const { token } = login.body.data;

    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'From CI', content: 'Integration test post', published: true });
    expect(created.status).toBe(201);

    const fetched = await request(app).get(`/api/posts/${created.body.data.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.title).toBe('From CI');
  });
});
