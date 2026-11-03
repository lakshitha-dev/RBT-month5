# Month 5 — Production Deployment (BlogFlow)

## Production URLs

| | URL |
|---|-----|
| **Application (HTTPS)** | https://blogflow-web.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io |
| Status page (live health) | https://blogflow-web.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io/status |
| API | https://blogflow-api.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io |
| Health check | https://blogflow-api.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io/health |
| API docs (Swagger) | https://blogflow-api.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io/api-docs |
| Source + CI/CD runs | https://github.com/lakshitha-dev/RBT-month5 · [Actions](https://github.com/lakshitha-dev/RBT-month5/actions) |
| Container images | `ghcr.io/lakshitha-dev/blogflow-api`, `ghcr.io/lakshitha-dev/blogflow-web` |

**Demo login:** `alice@example.com` / `password123` (also bob, carol, dave, eve @example.com)

> Both apps scale to zero when idle, so the first request after a quiet period takes a few seconds.

## Architecture

```
                    GitHub (push to main)
                           │
          ┌────────────────▼─────────────────┐
          │ GitHub Actions                    │  lint + unit/integration tests (Postgres service)
          │ test ─▶ build (matrix) ─▶ deploy  │  → images to GHCR, tagged sha-<commit>
          └────────────────┬─────────────────┘  → OIDC login to Azure (no stored password)
                           │ az containerapp update --image …:sha-<commit>
                           ▼
 Browser ──HTTPS──▶ blogflow-web ──HTTPS──▶ blogflow-api ──TLS──▶ Neon PostgreSQL
                    nginx + React SPA        Node 22 / Express     (AWS ap-southeast-1,
                    /api/* reverse proxy     pg pool, JWT          point-in-time restore)
                    Azure Container Apps (Southeast Asia), managed TLS, scale 0–2
                                             │
                                             │ /metrics (bearer token) · JSON logs (stdout)
                                             ▼
                    Prometheus ─▶ Grafana (16-panel dashboard + alert rules) ◀─ Loki ◀─ Alloy
```

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 19 + Vite SPA served by `nginx:1.29-alpine` | `/api` proxied to the API, so one image runs in every environment |
| Backend | Node 22 + Express on `node:22-alpine` | runs as non-root `node`, graceful SIGTERM shutdown, migrations on start under an advisory lock |
| Database | PostgreSQL 16 (local compose) / Neon serverless Postgres (production) | TLS `sslmode=verify-full`, connection pool (`pg.Pool`) |
| Hosting | Azure Container Apps (consumption) | HTTPS on `*.azurecontainerapps.io`, HTTP → 301 → HTTPS, auto-restart |
| Images | 64.8 MB API · 26.0 MB web (compressed, multi-stage Alpine) | immutable `sha-<commit>` tags in GHCR |

## Setup

### Run it locally (Docker Compose)

```bash
git clone https://github.com/lakshitha-dev/RBT-month5 && cd RBT-month5
cp .env.example .env                       # set POSTGRES_PASSWORD and JWT_SECRET
docker compose up --build -d               # db → backend → frontend, started in health order
docker compose exec backend node database/seeds/seed.js   # optional demo data
```

App http://localhost:8080 · API http://localhost:3000/health · Swagger http://localhost:3000/api-docs

With monitoring: `docker compose --profile monitoring up -d`, then Grafana at http://localhost:3001.

### Deploy to production (one-time)

1. **Database:** `neonctl projects create --name blogflow --region-id aws-ap-southeast-1` and copy the direct connection string.
2. **Azure:** resource group `blogflow-rg`, Container Apps environment, then `blogflow-api` and `blogflow-web`
   from the GHCR images; sensitive values (`DATABASE_URL`, `JWT_SECRET`, `METRICS_TOKEN`) are Container Apps
   secrets referenced with `secretref:`.
3. **CI → Azure:** `scripts/setup-ci-deploy.ps1` creates a managed identity trusted only for this repo's
   `production` environment (GitHub OIDC), grants it Contributor on `blogflow-rg` only, and stores the IDs and
   URLs as GitHub secrets/variables.

From then on every push to `main` tests, builds, deploys and smoke-tests production automatically.
Full commands: `docs/08-deployment-azure.md`.

## Deployment checklist

| Item | How |
|------|-----|
| Environment variables | `--env-vars`; secrets as Container Apps secrets (`secretref:`), never in the repo or images |
| Database connection | `DATABASE_URL` → Neon over TLS, pooled (`pg.Pool`, `DB_POOL_MAX`), migrations applied on boot |
| Custom domain | Supported, not configured: `az containerapp hostname add` + `bind` (free managed certificate) |
| HTTPS/SSL | Managed TLS; `allowInsecure: false` → plain HTTP is redirected (301) to HTTPS |
| Health checks | `/health` (API + DB check, 503 if DB down), `/health/live`, `/health/ready`, `/healthz` (nginx); CI smoke-tests them after every deploy |
| Auto-restart | Container Apps restarts failed containers; replicas scale 0 → 2 on HTTP load |

## Releases, rollback and blue-green

- Each deploy creates a new Container Apps revision from an immutable `sha-<commit>` image; traffic moves once it
  is running, and CI waits for `/health` to report the new version before rolling the frontend.
- **Rollback:** `az containerapp update -n blogflow-api -g blogflow-rg --image ghcr.io/lakshitha-dev/blogflow-api:sha-<previous>`,
  or re-run an older successful workflow run.
- **Blue-green:** switch the app to multiple-revision mode, deploy the new revision with 0% traffic, test it on its
  own revision URL, then shift traffic (`az containerapp ingress traffic set`) and keep the old revision for an instant switch back.

## Security

- No secrets in git or images: `.env` is gitignored; production secrets live in Container Apps; CI authenticates with
  short-lived OIDC tokens (no client secret), scoped to one resource group.
- `/metrics` requires a bearer token; helmet security headers, CORS restricted to the web origin, rate limiting.
- Images scanned with Trivy in CI; containers run as non-root.

## Data and backups

- Neon stores the data on managed, replicated storage; it survives app restarts and redeploys.
- **Backup / restore:** Neon keeps change history for point-in-time restore (6-hour window on the free plan):
  `neonctl branches restore` or create a branch at a past timestamp. For a portable copy:
  `pg_dump "$DATABASE_URL" -Fc -f blogflow-$(date +%F).dump`.
- Connections are pooled in the API (`pg.Pool`), with pool size, idle and waiting connections exported as metrics.

## Monitoring (production)

The screenshot (`lakshitha-month5-monitoring.png`) is the Grafana dashboard in its **production** view, taken
while load was sent to the live URL:

- **Metrics:** the live API's `/metrics` (request rate by route, error rate, p50/p95/p99 latency, CPU, memory,
  event-loop lag, DB pool) and Neon's Postgres stats, scraped by Prometheus (`monitoring/prometheus/prometheus.prod.yml`).
- **Logs:** structured JSON (winston) with levels and request IDs; production logs are forwarded into Loki
  (`scripts/prod-logs-to-loki.mjs`) and shown in the dashboard's log panels.
- **Alerts:** BackendDown, HighErrorRate, HighLatencyP95, HighMemoryUsage, DatabaseDown, DbPoolSaturated
  (Prometheus rules + Grafana alerting with a webhook contact point).

## Documentation in the repository

`README.md` (overview, quick start, env vars) and `docs/`: architecture (`05`), local setup (`06`), CI/CD (`07`),
Azure deployment (`08`), monitoring (`09`), offline milestones (`10`).
