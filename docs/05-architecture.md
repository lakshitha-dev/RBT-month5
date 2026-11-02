# Architecture

## Runtime topology

```
                         ┌──────────────────────── docker compose / Render ────────────────────────┐
                         │                                                                          │
 Browser ──HTTPS──▶  frontend (nginx:alpine)                                                        │
                         │  • serves the React SPA (static, hashed assets cached 1y)                │
                         │  • /api/*  ──reverse proxy──▶  backend (node:22-alpine, Express)         │
                         │  • /healthz (web tier probe)        │  • REST API  /api/*                │
                         │                                     │  • /health /health/live /ready     │
                         │                                     │  • /metrics (Prometheus)           │
                         │                                     ▼                                    │
                         │                              db (PostgreSQL 16)                          │
                         │                              named volume / Render managed DB            │
                         └──────────────────────────────────────────────────────────────────────────┘

 monitoring profile (local):
   backend /metrics ──scrape──▶ Prometheus ──▶ Grafana (dashboard + alerts) ◀── Loki ◀── Alloy ◀── container stdout
   postgres-exporter ──scrape──▶ Prometheus
```

Because the SPA calls a **relative** `/api` path and nginx forwards it, the browser only ever talks
to one origin — no CORS, no build-time API URL, and the same frontend image runs locally and in
production (only `API_UPSTREAM` changes).

## Components

| Component | Image | Port | Notes |
|-----------|-------|------|-------|
| frontend | `blogflow-web` (nginx 1.29 alpine) | 80 (`PORT` on Render) | Multi-stage: Vite build in `node:22-alpine`, only `dist/` shipped |
| backend | `blogflow-api` (node 22 alpine) | 3000 (`PORT`) | Non-root `node` user, prod deps only, npm removed, migrations on boot |
| db | `postgres:16-alpine` | 5432 (internal only) | Named volume `postgres_data`; Render managed Postgres in prod |
| prometheus | `prom/prometheus` | 9090 | 15s scrape, 7d retention, alert rules |
| grafana | `grafana/grafana` | 3001 | Provisioned datasources, dashboard, alert rules |
| loki | `grafana/loki` | 3100 (internal) | Log storage, 7d retention |
| alloy | `grafana/alloy` | 12345 | Tails Docker container logs → Loki |
| postgres-exporter | `prometheuscommunity/postgres-exporter` | 9187 (internal) | DB connections, `pg_up` |

## Networks

- `app-network` — db, backend, frontend (+ prometheus, postgres-exporter to reach them)
- `monitoring` — prometheus, loki, alloy, grafana

Only the frontend (8080) and, for debugging, the backend (3000) are published to the host.
The database is never exposed.

## Startup ordering

`db` (healthy: `pg_isready`) → `backend` (healthy: `/health/ready` = DB reachable, migrations
applied) → `frontend`. Each uses `depends_on: condition: service_healthy`.

## Backend request lifecycle

1. `requestLogger` assigns/propagates `X-Request-Id`, starts a timer
2. `helmet`, `cors`
3. health/metrics routes (before the rate limiter, so probes are never throttled)
4. rate limiter → body parsers → API routers
5. on `finish`: Prometheus counter + histogram labelled by **route pattern** (bounded
   cardinality), structured JSON log line (`info`/`warn`/`error` by status)

## Health endpoints

| Endpoint | Checks | Used by |
|----------|--------|---------|
| `GET /health/live` | process is serving | Docker `HEALTHCHECK` |
| `GET /health/ready` | DB `SELECT 1` | compose healthcheck, Render health check (gates zero-downtime deploys) |
| `GET /health` | DB + latency, memory, uptime, version | humans, SPA status page, CI smoke test |
| `GET /healthz` (frontend) | nginx serving | frontend Docker `HEALTHCHECK`, Render |
