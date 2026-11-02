# Month 5 — Implementation Plan

## Starting point

The brief expects "the fullstack app from Months 2–4" (React SPA + Express API + PostgreSQL).
What actually exists from earlier months:

| Month | Project | State |
|-------|---------|-------|
| 2 | **BlogFlow API** (Express 4 + `pg` + JWT, SQL schema + seed) | Working backend, no frontend |
| 3 | ShopFlow database design (SQL only) | No application code |
| 4 | AdminFlow dashboard | `src/` empty — never implemented |

**Decision:** copy the Month 2 BlogFlow API into `backend/`, harden it for production, and
build a new small React + Vite SPA in `frontend/` that consumes it.

| Area | Choice |
|------|--------|
| Cloud | **Render** — image-backed web services pulled from GHCR, managed Postgres, automatic HTTPS |
| Registry | GitHub Container Registry (`ghcr.io`) |
| CI/CD | GitHub Actions: test → build/push images → deploy hook → smoke test |
| Monitoring | Prometheus + Grafana + Loki + Grafana Alloy (docker-compose `monitoring` profile) |

## Repository layout

```
docs/                       this documentation
backend/                    BlogFlow API (Express) + Dockerfile
frontend/                   React + Vite SPA + Dockerfile + nginx template
monitoring/                 prometheus / grafana / loki / alloy configs
scripts/                    load test, submission packaging
.github/workflows/ci-cd.yml CI/CD pipeline
docker-compose.yml          app stack + monitoring profile
render.yaml                 Render blueprint
submission/                 lakshitha-month5-* deliverables
```

## Work breakdown

### Part 1 — Containerization
- Backend: split `app.js` (builds the app) from `server.js` (listen + graceful shutdown),
  `DATABASE_URL` support, SQL migration runner, multi-stage `node:22-alpine` image running as
  the non-root `node` user with a `HEALTHCHECK`.
- Frontend: Vite build in a Node stage, served by `nginx:alpine`; `/api` reverse-proxied to the
  backend via an nginx template (`API_UPSTREAM`), so one image works in every environment.
- Compose: `db` → `backend` → `frontend` chained with `depends_on: condition: service_healthy`,
  a private bridge network, named volume for Postgres, secrets from `.env`.

### Part 2 — CI/CD
- `backend-test` (lint + Jest with a Postgres service container), `frontend-test`
  (lint + Vitest + build), `docker` (matrix build/push to GHCR with GHA cache, Trivy scan),
  `deploy` (Render deploy hooks pinned to the commit SHA image, then smoke tests).
- PRs build images but never push or deploy.

### Part 3 — Cloud deployment (Render)
- `render.yaml` blueprint: `blogflow-db` (Postgres), `blogflow-api`, `blogflow-web`.
- HTTPS is automatic on `*.onrender.com`; health-check-gated zero-downtime deploys and
  auto-restart come from Render.

### Part 4 — Monitoring
- Structured JSON logs (winston) to stdout → Alloy → Loki.
- `prom-client` metrics at `/metrics` → Prometheus → Grafana dashboard
  (request rate, error rate, latency percentiles, CPU/memory, DB connections).
- Prometheus alert rules (backend down, error rate, p95 latency, memory).
- `/health`, `/health/live`, `/health/ready` endpoints.

## Deviations from the brief

| Brief | Implementation | Why |
|-------|----------------|-----|
| `node:18-alpine` | `node:22-alpine` | Node 18 is end-of-life; 22 is the current LTS |
| `npm ci --only=production` | `npm ci --omit=dev` | `--only` is deprecated |
| `version: '3.8'` in compose | omitted | The `version` key is obsolete in Compose v2+ |
| `depends_on: [db]` | `depends_on` with `condition: service_healthy` | Starts the API only once Postgres accepts connections |
| winston file transports | Console (stdout) only | 12-factor: containers log to stdout; the platform/Loki aggregates |
| `bcrypt` (Month 2) | `bcryptjs` | Pure JS — no native build toolchain needed in Alpine images |
| Single `:latest` tag | `sha-<commit>` + `latest` | Immutable tags make deploys reproducible and rollbacks trivial |
| Hard-coded DB credentials in compose | Read from `.env` | Never commit secrets |
| Plain `nginx.conf` | `default.conf.template` with `API_UPSTREAM` | Same image for local and production |
