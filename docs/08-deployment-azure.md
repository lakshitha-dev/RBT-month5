# Production Deployment — Azure Container Apps + Neon

| Piece | Where | Notes |
|-------|-------|-------|
| `blogflow-web` (nginx + SPA) | Azure Container Apps, `blogflow-env`, Southeast Asia | external HTTPS ingress → port 80, scale 0–2 |
| `blogflow-api` (Express) | Azure Container Apps, same environment | external HTTPS ingress → port 3000, scale 0–2 |
| PostgreSQL | [Neon](https://neon.tech) free tier, AWS `ap-southeast-1` (Singapore) | serverless Postgres, TLS (`sslmode=verify-full`) |
| Images | `ghcr.io/lakshitha-dev/blogflow-api` / `blogflow-web` (public) | built by CI, deployed by immutable `sha-<commit>` tag |

```
Browser ─HTTPS─▶ blogflow-web (nginx) ─HTTPS─▶ blogflow-api (Express) ─TLS─▶ Neon Postgres
                  *.azurecontainerapps.io        *.azurecontainerapps.io        ap-southeast-1
```

Why this split: Render and Railway both required a card / paid plan for new accounts, and
Azure for Students covers Container Apps. Running Postgres on Neon instead of Azure Database
for PostgreSQL keeps the whole deployment at roughly **$0/month** (Container Apps consumption
free grant + Neon free plan) instead of ~$15/month for a B1ms flexible server.

## One-time setup (what was run)

### 1. Database — Neon CLI

```bash
npm i -g neonctl
neonctl auth
neonctl projects create --name blogflow --region-id aws-ap-southeast-1 --database blogflow --role blogflow
neonctl connection-string --project-id <project-id> --database-name blogflow --role-name blogflow
```

Use the **direct** (non-pooled) connection string: the migration runner takes a session-level
advisory lock, which PgBouncer transaction pooling does not support. Change `sslmode=require` to
`sslmode=verify-full` (node-postgres treats them the same today and warns about it).

Schema + demo data (the API also applies migrations itself on start):

```bash
cd backend
DATABASE_URL="<neon url>" DB_SSL=true node database/migrate.js
DATABASE_URL="<neon url>" DB_SSL=true node database/seeds/seed.js
```

### 2. Azure Container Apps

```bash
az login                                    # pick the subscription
az provider register --namespace Microsoft.App --wait
az extension add --name containerapp --upgrade

az group create -n blogflow-rg -l southeastasia
az containerapp env create -n blogflow-env -g blogflow-rg -l southeastasia --logs-destination none

DOMAIN=$(az containerapp env show -n blogflow-env -g blogflow-rg --query properties.defaultDomain -o tsv)

az containerapp create -n blogflow-api -g blogflow-rg --environment blogflow-env \
  --image ghcr.io/lakshitha-dev/blogflow-api:latest \
  --ingress external --target-port 3000 --cpu 0.25 --memory 0.5Gi --min-replicas 0 --max-replicas 2 \
  --secrets database-url="<neon url>" jwt-secret="<random>" metrics-token="<random>" \
  --env-vars NODE_ENV=production DATABASE_URL=secretref:database-url DB_SSL=true \
             JWT_SECRET=secretref:jwt-secret METRICS_TOKEN=secretref:metrics-token \
             RUN_MIGRATIONS=true TRUST_PROXY=3 RATE_LIMIT_MAX=300 \
             CORS_ORIGIN=https://blogflow-web.$DOMAIN

az containerapp create -n blogflow-web -g blogflow-rg --environment blogflow-env \
  --image ghcr.io/lakshitha-dev/blogflow-web:latest \
  --ingress external --target-port 80 --cpu 0.25 --memory 0.5Gi --min-replicas 0 --max-replicas 2 \
  --env-vars API_UPSTREAM=https://blogflow-api.$DOMAIN
```

> Windows: `az` is a `.cmd` wrapper, so an `&` inside a value (Neon URLs contain
> `&channel_binding=require`) splits the command. Drop that parameter or quote it for cmd.

Secrets are Container Apps secrets referenced with `secretref:` — they never appear in the
image, the repo or the app's environment listing.

### 3. CI → Azure (OIDC, no stored password)

GitHub signs in to Azure as a **user-assigned managed identity** through a federated
credential, so there is no client secret to leak or rotate. The identity can only touch
`blogflow-rg`.

```bash
az identity create -n blogflow-github-deploy -g blogflow-rg
az identity federated-credential create -g blogflow-rg --identity-name blogflow-github-deploy \
  --name github-production --issuer https://token.actions.githubusercontent.com \
  --subject repo:lakshitha-dev/RBT-month5:environment:production \
  --audiences api://AzureADTokenExchange
az role assignment create --role Contributor \
  --assignee-object-id <identity principalId> --assignee-principal-type ServicePrincipal \
  --scope $(az group show -n blogflow-rg --query id -o tsv)
```

GitHub → Settings → Secrets and variables → Actions:

| Kind | Name | Value |
|------|------|-------|
| Secret | `AZURE_CLIENT_ID` | identity `clientId` |
| Secret | `AZURE_TENANT_ID` | tenant id |
| Secret | `AZURE_SUBSCRIPTION_ID` | subscription id |
| Variable | `API_URL` | `https://blogflow-api.<domain>` |
| Variable | `FRONTEND_URL` | `https://blogflow-web.<domain>` |

The deploy job then runs `az containerapp update --image ghcr.io/…:sha-<commit>` for each app.

## Deployment checklist (from the brief)

| Item | How it's done |
|------|---------------|
| Configure environment variables | `--env-vars`; sensitive values as Container Apps secrets (`secretref:`) |
| Set up database connection | `DATABASE_URL` → Neon over TLS (`DB_SSL=true`, `sslmode=verify-full`); migrations run on boot under an advisory lock |
| Configure custom domain | Optional: `az containerapp hostname add` + `az containerapp hostname bind --validation-method CNAME` (free managed certificate); then update `CORS_ORIGIN` / `FRONTEND_URL` |
| Enable HTTPS/SSL | Automatic on `*.azurecontainerapps.io`; ingress has `allowInsecure: false`, so HTTP is redirected to HTTPS |
| Set up health checks | `/health` (API + DB), `/health/live`, `/health/ready`, `/healthz` (web); Container Apps probes the target ports; CI smoke-tests the HTTP endpoints |
| Configure auto-restart | Container Apps restarts crashed containers automatically; replicas scale 0 → 2 on HTTP load |

## Rollout and rollback

`az containerapp update --image …:sha-<commit>` creates a new revision; Container Apps starts it
and moves traffic to it once it is running. CI waits until `/health` reports the new
`sha-<commit>` before rolling the frontend, then smoke-tests through the public URL.

Rollback = deploy a previous immutable tag:

```bash
az containerapp update -n blogflow-api -g blogflow-rg --image ghcr.io/lakshitha-dev/blogflow-api:sha-<previous>
```

…or re-run an older successful workflow run from the Actions tab.

## Operations

```bash
az containerapp logs show -n blogflow-api -g blogflow-rg --type console --follow   # JSON logs
az containerapp show -n blogflow-api -g blogflow-rg --query properties.runningStatus
neonctl projects list
```

## Cost and caveats

- Both apps scale to zero when idle: the first request afterwards takes a few seconds
  (CI's checks retry for this).
- Container Apps consumption plan: the monthly free grant (180k vCPU-s, 360k GiB-s, 2M requests)
  covers this traffic. No Log Analytics workspace is attached, so there is no log ingestion cost.
- Neon free plan: 0.5 GB storage, compute auto-suspends when idle (first query after a pause
  takes ~0.5 s).

Teardown when no longer needed:

```bash
az group delete -n blogflow-rg --yes
neonctl projects delete <project-id>
```

## Production URLs

Recorded in [`../submission/lakshitha-month5-deployment-url.md`](../submission/lakshitha-month5-deployment-url.md).
An alternative Render setup (`render.yaml`) is documented in
[08b-deployment-render.md](08b-deployment-render.md).
