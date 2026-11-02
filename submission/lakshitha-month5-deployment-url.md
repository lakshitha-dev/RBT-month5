# Month 5 — Production Deployment

> ⚠️ Fill in after completing [docs/08-deployment-render.md](../docs/08-deployment-render.md).

| | URL |
|---|-----|
| **Application (HTTPS)** | https://blogflow-web.onrender.com |
| API | https://blogflow-api.onrender.com |
| Health | https://blogflow-api.onrender.com/health |
| API docs (Swagger) | https://blogflow-api.onrender.com/api-docs |
| Status page | https://blogflow-web.onrender.com/status |
| CI/CD runs | https://github.com/lakshitha-dev/RBT-month5/actions |
| Images | https://github.com/lakshitha-dev?tab=packages |

**Platform:** Render (free tier, region Singapore). Web services run the `ghcr.io/…:sha-<commit>`
images built by GitHub Actions; database is Render managed PostgreSQL 16.

**HTTPS:** automatic TLS certificate (Let's Encrypt) managed by Render; HTTP redirects to HTTPS.

**Demo login** (after seeding): `alice@example.com` / `password123`

> Free instances sleep after ~15 minutes idle — the first request can take up to a minute.
