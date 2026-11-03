# Month 5 Documentation — DevOps & Production Deployment

**Project:** BlogFlow — React SPA + Express API + PostgreSQL, containerised, deployed via CI/CD and monitored.

## Session material

| Doc | Contents |
|-----|----------|
| [01-session-overview.md](01-session-overview.md) | Session agenda, learning objectives, deliverables, offline milestones, resources, assessment |
| [02-challenge-brief.md](02-challenge-brief.md) | Full challenge brief with the reference Dockerfiles, compose, workflow, logger, health check |
| [03-video-notes.md](03-video-notes.md) | Session recording link + notes template |

## Implementation

| Doc | Contents |
|-----|----------|
| [04-implementation-plan.md](04-implementation-plan.md) | Starting point, decisions, work breakdown, deviations from the brief |
| [05-architecture.md](05-architecture.md) | Topology, components, networks, health endpoints |
| [06-local-setup.md](06-local-setup.md) | Run locally with Docker Compose, tests, troubleshooting |
| [07-cicd.md](07-cicd.md) | GitHub Actions pipeline, image tags, secrets, rollback |
| [08-deployment-azure.md](08-deployment-azure.md) | Production: Azure Container Apps + Neon Postgres, HTTPS, OIDC deploys, rollback, cost |
| [08b-deployment-render.md](08b-deployment-render.md) | Alternative host: Render blueprint (`render.yaml`) |
| [09-monitoring.md](09-monitoring.md) | Logs, metrics, dashboard, alerting, monitoring production |
| [10-offline-milestones.md](10-offline-milestones.md) | Plan and status for the offline milestones |
| [reference/](reference) | Month 2 API readme and Postman collection |

## Learning objectives → where they're met

| Objective | Evidence |
|-----------|----------|
| Containerize fullstack applications with Docker | `backend/Dockerfile`, `frontend/Dockerfile` (multi-stage, non-root, healthchecks) |
| Multi-container setups with Docker Compose | `docker-compose.yml` (app + `monitoring` profile) |
| CI/CD pipelines with GitHub Actions | `.github/workflows/ci-cd.yml` |
| Deploy applications to cloud platforms | Azure Container Apps + Neon, [08-deployment-azure.md](08-deployment-azure.md) |
| Configure monitoring and logging | `monitoring/`, [09-monitoring.md](09-monitoring.md) |

## Deliverables

| # | Deliverable | Location | Status |
|---|-------------|----------|--------|
| 1 | Dockerfiles | `submission/lakshitha-month5-dockerfiles/` | ✅ |
| 2 | docker-compose.yml | `submission/lakshitha-month5-docker-compose.yml` | ✅ |
| 3 | CI/CD pipeline | `submission/lakshitha-month5-github-workflow.yml` | ✅ |
| 4 | Production URL | `submission/lakshitha-month5-deployment-url.md` | ✅ live on Azure |
| 5 | Monitoring dashboard | `submission/lakshitha-month5-monitoring.png` | ✅ production view |

## Assessment rubric

| Category | Points | What evaluators look for | Where |
|----------|--------|--------------------------|-------|
| Containerization | 25 | Multi-stage builds, optimized images | Dockerfiles, `.dockerignore`, compose healthchecks |
| CI/CD Pipeline | 25 | Tests, builds, deploys automatically | `ci-cd.yml` |
| Cloud Deployment | 25 | Working HTTPS production URL | Azure Container Apps (`submission/lakshitha-month5-deployment-url.md`) |
| Monitoring | 15 | Logs, metrics, health checks | `monitoring/`, `/health`, `/metrics` |
| Documentation | 10 | Clear setup instructions | this folder + root `README.md` |
