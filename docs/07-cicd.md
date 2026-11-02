# CI/CD Pipeline

Workflow: [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

```
push / PR
   │
   ├── backend-test ─────┐   lint · migrate · Jest (unit + integration vs Postgres service) · coverage artifact
   ├── frontend-test ────┤   lint (oxlint) · Vitest · vite build
   │                     ▼
   └────────────── docker (matrix: backend, frontend)
                         buildx · GHA layer cache · tags sha-<short> / branch / latest · Trivy scan
                         PR → build only     main/develop → push to ghcr.io
                         ▼
                   deploy  (main only, GitHub "production" environment)
                         Render deploy hook ?imgURL=…:sha-<short>  (API)
                         wait until /health reports the new version
                         Render deploy hook (frontend)
                         smoke test: /healthz, /api/health, /api/posts
```

## Triggers

| Event | test | docker build | push to GHCR | deploy |
|-------|------|--------------|--------------|--------|
| PR → main | ✅ | ✅ | ❌ | ❌ |
| push develop | ✅ | ✅ | ✅ | ❌ |
| push main | ✅ | ✅ | ✅ | ✅ |
| manual (`workflow_dispatch`) | ✅ | ✅ | ✅ | if on main |

`concurrency` cancels an in-progress run when a newer commit lands on the same branch.

## Image tags

`ghcr.io/<owner>/blogflow-api` and `ghcr.io/<owner>/blogflow-web`:

- `sha-abc1234` — immutable, what production runs (and what you roll back to)
- `main` / `develop` — moving branch tag
- `latest` — latest main build

The commit SHA is also baked into the API as `APP_VERSION` and reported by `/health`, which is
how the deploy job knows the new version is live.

## Required configuration (GitHub → Settings)

| Kind | Name | Value |
|------|------|-------|
| Secret | `RENDER_BACKEND_DEPLOY_HOOK` | Render → blogflow-api → Settings → Deploy Hook |
| Secret | `RENDER_FRONTEND_DEPLOY_HOOK` | Render → blogflow-web → Settings → Deploy Hook |
| Variable | `API_URL` | e.g. `https://blogflow-api.onrender.com` |
| Variable | `FRONTEND_URL` | e.g. `https://blogflow-web.onrender.com` |
| Environment | `production` | optional: add required reviewers for a manual approval gate |

`GITHUB_TOKEN` (automatic) pushes to GHCR — the workflow requests `packages: write` for that job only.

## Rollback

Re-deploy a previous immutable image:

```bash
curl -X POST "$RENDER_BACKEND_DEPLOY_HOOK&imgURL=ghcr.io/<owner>/blogflow-api:sha-<previous>"
```

…or Render dashboard → service → Events → *Rollback*.

## Improvements backlog (Pipeline Review)

- Make Trivy blocking for CRITICAL once the baseline is clean; add CodeQL (SAST) and OWASP ZAP baseline (DAST) against a preview environment
- Preview environments per PR (Render preview environments)
- Cache `node_modules` for Vitest/Jest across jobs; split integration tests into their own job
- Sign images (cosign) and generate SBOMs (`docker/build-push-action` `sbom: true`)
- Manual approval on the `production` environment
