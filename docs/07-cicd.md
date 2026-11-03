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
                         azure/login via OIDC (managed identity, no stored password)
                         az containerapp update --image …:sha-<short>  (API)
                         wait until /health reports the new version
                         az containerapp update --image …:sha-<short>  (frontend)
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
| Secret | `AZURE_CLIENT_ID` | client id of the `blogflow-github-deploy` managed identity |
| Secret | `AZURE_TENANT_ID` | Entra tenant id |
| Secret | `AZURE_SUBSCRIPTION_ID` | subscription that holds `blogflow-rg` |
| Variable | `API_URL` | `https://blogflow-api.<env-domain>.azurecontainerapps.io` |
| Variable | `FRONTEND_URL` | `https://blogflow-web.<env-domain>.azurecontainerapps.io` |
| Variable | `AZURE_RESOURCE_GROUP` | optional, defaults to `blogflow-rg` |
| Environment | `production` | the federated credential trusts only this environment; optional required reviewers = manual approval gate |

`GITHUB_TOKEN` (automatic) pushes to GHCR — the workflow requests `packages: write` for that job
only. The deploy job requests `id-token: write` so GitHub can mint the OIDC token Azure trusts.
Setup commands are in [08-deployment-azure.md](08-deployment-azure.md#3-ci--azure-oidc-no-stored-password).

## Rollback

Re-deploy a previous immutable image:

```bash
az containerapp update -n blogflow-api -g blogflow-rg --image ghcr.io/<owner>/blogflow-api:sha-<previous>
```

…or re-run an older successful workflow run (Actions → run → *Re-run all jobs*).

## Improvements backlog (Pipeline Review)

- Make Trivy blocking for CRITICAL once the baseline is clean; add CodeQL (SAST) and OWASP ZAP baseline (DAST) against a preview environment
- Preview environments per PR (a Container Apps revision with its own label per PR, or a Neon branch per PR)
- Cache `node_modules` for Vitest/Jest across jobs; split integration tests into their own job
- Sign images (cosign) and generate SBOMs (`docker/build-push-action` `sbom: true`)
- Manual approval on the `production` environment
