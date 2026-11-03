# Month 5 — Production Deployment

| | URL |
|---|-----|
| **Application (HTTPS)** | https://blogflow-web.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io |
| Status page | https://blogflow-web.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io/status |
| API | https://blogflow-api.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io |
| Health | https://blogflow-api.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io/health |
| API docs (Swagger) | https://blogflow-api.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io/api-docs |
| CI/CD runs | https://github.com/lakshitha-dev/RBT-month5/actions |
| Images | https://github.com/lakshitha-dev?tab=packages |

**Platform:** Azure Container Apps (consumption, Southeast Asia) runs the `ghcr.io/lakshitha-dev/blogflow-web`
and `blogflow-api` images built by GitHub Actions, deployed by immutable `sha-<commit>` tag.
The database is Neon serverless PostgreSQL (AWS ap-southeast-1, Singapore) over TLS.

**HTTPS:** managed TLS certificates on `*.azurecontainerapps.io`; plain HTTP is redirected (301) to HTTPS.

**Health checks:** `/health` (API + database), `/health/live`, `/health/ready`, `/healthz` (web).
CI smoke-tests `/healthz`, `/api/health` and `/api/posts` after every production deploy.

**Demo login:** `alice@example.com` / `password123` (also bob, carol, dave, eve @example.com)

> Both apps scale to zero when idle, so the first request after a quiet period takes a few seconds.

Setup and operations: [docs/08-deployment-azure.md](../docs/08-deployment-azure.md)
