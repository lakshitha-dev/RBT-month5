# BlogFlow — Month 5: DevOps & Production Deployment

The Month 2 BlogFlow API plus a new React SPA, containerised with Docker, built and deployed by
GitHub Actions to Azure Container Apps (database on Neon), and observed with Prometheus, Grafana and Loki.

**Live:** https://blogflow-web.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io
· [![CI/CD](https://github.com/lakshitha-dev/RBT-month5/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/lakshitha-dev/RBT-month5/actions/workflows/ci-cd.yml)

## Month 5 submission

| Deliverable | File |
|-------------|------|
| Dockerfiles | [`submission/lakshitha-month5-dockerfiles/`](submission/lakshitha-month5-dockerfiles/) |
| Docker Compose | [`submission/lakshitha-month5-docker-compose.yml`](submission/lakshitha-month5-docker-compose.yml) |
| CI/CD pipeline | [`submission/lakshitha-month5-github-workflow.yml`](submission/lakshitha-month5-github-workflow.yml) (runs from [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml)) |
| Production URL | [`submission/lakshitha-month5-deployment-url.md`](submission/lakshitha-month5-deployment-url.md) |
| Monitoring dashboard | [`submission/lakshitha-month5-monitoring.png`](submission/lakshitha-month5-monitoring.png) |

```
Browser ─HTTPS─▶ nginx (SPA + /api proxy) ─▶ Express API ─▶ PostgreSQL
                                              │ /metrics, JSON logs
                                              ▼
                               Prometheus · Loki ─▶ Grafana (dashboard + alerts)
```

| | |
|---|---|
| **Frontend** | React 19 + Vite + TypeScript, served by nginx (`frontend/`) |
| **Backend** | Node 22 + Express, `pg`, JWT, winston, prom-client (`backend/`) |
| **Database** | PostgreSQL 16 (local) · Neon serverless Postgres (production) |
| **CI/CD** | GitHub Actions → GHCR → Azure Container Apps via OIDC (`.github/workflows/ci-cd.yml`) |
| **Hosting** | Azure Container Apps, automatic HTTPS (`render.yaml` kept as an alternative) |
| **Monitoring** | Prometheus, Grafana, Loki, Alloy, postgres-exporter (`monitoring/`) |

## Quick start

```bash
cp .env.example .env          # set POSTGRES_PASSWORD and JWT_SECRET
docker compose up --build -d
docker compose exec backend node database/seeds/seed.js   # optional demo data
```

- App: http://localhost:8080 (demo login `alice@example.com` / `password123` after seeding)
- API docs: http://localhost:3000/api-docs
- Health: http://localhost:3000/health · Metrics: http://localhost:3000/metrics

### With monitoring

```bash
docker compose --profile monitoring up -d
node scripts/load-test.mjs
```

Grafana: http://localhost:3001 (admin / admin) → **BlogFlow — Service Overview**.

## Repository layout

```
backend/                  Express API, Dockerfile, tests, SQL migrations + runner
frontend/                 React SPA, Dockerfile, nginx template
monitoring/               Prometheus (scrape + alert rules), Grafana (provisioning + dashboard), Loki, Alloy
.github/workflows/        CI/CD pipeline
docker-compose.yml        app stack + `monitoring` profile
render.yaml               Render Blueprint (alternative host)
scripts/                  load test, submission packaging
docs/                     session material + architecture, setup, CI/CD, deployment, monitoring guides
submission/               lakshitha-month5-* deliverables
```

## Environment variables

| Variable | Service | Default | Purpose |
|----------|---------|---------|---------|
| `DATABASE_URL` | backend | — | Postgres connection string (falls back to `DB_HOST`/`DB_*`) |
| `DB_SSL` | backend | `false` | TLS to Postgres |
| `JWT_SECRET` | backend | **required** | JWT signing key |
| `JWT_EXPIRES_IN` | backend | `24h` | Token lifetime |
| `LOG_LEVEL` | backend | `info` | winston level |
| `RUN_MIGRATIONS` | backend | `true` | Apply `database/migrations/*.sql` on start |
| `RATE_LIMIT_MAX` | backend | `100` | Requests / minute / IP |
| `TRUST_PROXY` | backend | `1` | Proxy hops in front of the API |
| `CORS_ORIGIN` | backend | `*` | Allowed origins (comma-separated) |
| `METRICS_TOKEN` | backend | — | Bearer token required for `/metrics` when set |
| `API_UPSTREAM` | frontend | `http://backend:3000` | Where nginx proxies `/api` |
| `PORT` | both | 3000 / 80 | Listen port |

## Documentation

Start at [docs/README.md](docs/README.md):
[architecture](docs/05-architecture.md) ·
[local setup](docs/06-local-setup.md) ·
[CI/CD](docs/07-cicd.md) ·
[deployment](docs/08-deployment-azure.md) ·
[monitoring](docs/09-monitoring.md)

## Deliverables

```powershell
powershell -File scripts/package-submission.ps1
```

| # | Deliverable | File |
|---|-------------|------|
| 1 | Dockerfiles | `submission/lakshitha-month5-dockerfiles/` |
| 2 | Compose | `submission/lakshitha-month5-docker-compose.yml` |
| 3 | CI/CD | `submission/lakshitha-month5-github-workflow.yml` |
| 4 | Production URL | `submission/lakshitha-month5-deployment-url.md` |
| 5 | Dashboard | `submission/lakshitha-month5-monitoring.png` |
