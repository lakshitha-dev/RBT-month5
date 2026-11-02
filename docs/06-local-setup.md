# Local Setup

## Prerequisites

- Docker Desktop (Compose v2)
- Node.js 22+ (only for running tests / dev servers outside Docker)

## 1. Run the whole stack in Docker

```bash
cp .env.example .env
# edit .env: set POSTGRES_PASSWORD and JWT_SECRET
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

docker compose up --build -d
docker compose ps            # db, backend, frontend → (healthy)
```

| URL | What |
|-----|------|
| http://localhost:8080 | BlogFlow SPA |
| http://localhost:8080/status | Status page (live `/health`) |
| http://localhost:3000/api-docs | Swagger UI |
| http://localhost:3000/health | Health report |
| http://localhost:3000/metrics | Prometheus metrics |

Load demo data (5 users, 20 posts, 50 comments — **truncates existing data**; all passwords `password123`):

```bash
docker compose exec backend node database/seeds/seed.js
```

## 2. Add monitoring

```bash
docker compose --profile monitoring up -d
node scripts/load-test.mjs            # 2 min of mixed traffic
```

| URL | What |
|-----|------|
| http://localhost:3001 | Grafana (admin / admin) → *BlogFlow — Service Overview* |
| http://localhost:9090/alerts | Prometheus alert rules |
| http://localhost:12345 | Alloy pipeline UI |

## 3. Develop without Docker

```bash
# database only
docker compose up -d db

# backend (hot reload)
cd backend
cp .env.example .env     # DATABASE_URL=postgres://blogflow:<POSTGRES_PASSWORD>@localhost:5432/blogflow
```

> The compose file doesn't publish the DB port. For local dev add a
> `docker-compose.override.yml` with `services: { db: { ports: ["5432:5432"] } }`.

```bash
npm install
npm run dev              # http://localhost:3000

# frontend (Vite dev server proxies /api → localhost:3000)
cd ../frontend
npm install
npm run dev              # http://localhost:5173
```

## 4. Tests & lint

```bash
cd backend  && npm run lint && npm test          # unit tests (DB mocked)
DATABASE_URL=postgres://... npm test             # + integration test against a real DB
cd frontend && npm run lint && npm test && npm run build
```

Run the backend tests inside the image build:

```bash
docker build --target test backend
```

## Useful commands

```bash
docker compose logs -f backend                   # JSON logs
docker compose exec db psql -U blogflow          # SQL shell
docker compose down                              # stop (keeps data)
docker compose --profile monitoring down -v      # stop + delete all volumes
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `required variable JWT_SECRET is missing` | Create `.env` from `.env.example` |
| backend `unhealthy` | `docker compose logs backend` — usually DB credentials changed after the volume was created; `docker compose down -v` to reset |
| frontend 502 on `/api` | backend not healthy yet, or `API_UPSTREAM` wrong |
| Grafana panels empty | Run the load test; check http://localhost:9090/targets are `UP` |
| Logs panel empty | Alloy needs the Docker socket; check http://localhost:12345 |
