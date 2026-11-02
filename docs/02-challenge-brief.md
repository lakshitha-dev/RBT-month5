# Month 5 Challenge Brief — Production Infrastructure

- **Role:** You are setting up production infrastructure for your application
- **Time:** 4 hours (in-session) + ongoing offline work
- **Deliverables:** 5 artifacts

## Context

### Project Profile

- **Application:** Fullstack app from Months 2–4
- **Frontend:** React SPA
- **Backend:** Node.js/Express API
- **Database:** PostgreSQL
- **Goal:** Production-ready deployment

### Infrastructure Requirements

- Multi-container Docker setup
- CI/CD with automated tests
- Cloud deployment with HTTPS
- Basic monitoring and logging
- Blue-green deployment capability

---

## Challenge Tasks

> The snippets below are the **reference examples from the brief**. The actual
> implementation in this repo improves on them — see
> [04-implementation-plan.md](04-implementation-plan.md#deviations-from-the-brief).

### Part 1: Containerization (30 min)

**Frontend Dockerfile (multi-stage):**

```dockerfile
# frontend/Dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
USER node
CMD ["node", "src/server.js"]
```

**Docker Compose:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=app
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Part 2: CI/CD Pipeline (40 min)

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Run linting
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          # Deploy script here
          echo "Deploying to production..."
```

### Part 3: Cloud Deployment (30 min)

**Deployment Options:**

| Platform             | Difficulty | Cost          |
|----------------------|------------|---------------|
| Azure Container Apps | Medium     | Free tier     |
| AWS ECS              | Medium     | Pay-as-you-go |
| GCP Cloud Run        | Medium     | Free tier     |
| Railway              | Easy       | Free tier     |
| Render               | Easy       | Free tier     |

**Deployment Checklist:**
- [ ] Configure environment variables
- [ ] Set up database connection
- [ ] Configure custom domain
- [ ] Enable HTTPS/SSL
- [ ] Set up health checks
- [ ] Configure auto-restart

### Part 4: Monitoring Setup (20 min)

**Logging Configuration:**

```js
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

**Health Check Endpoint:**

```js
// backend/src/routes/health.js
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      memory: process.memoryUsage(),
    }
  };
  res.json(health);
});
```

**Monitoring Dashboard Requirements:**
- Request rate and latency
- Error rate
- CPU/Memory usage
- Database connections
- Response time percentiles

---

## Submission Requirements

### Required Files

| File                                    | Contents              |
|-----------------------------------------|-----------------------|
| `[name]-month5-dockerfiles/`            | All Dockerfiles       |
| `[name]-month5-docker-compose.yml`      | Compose file          |
| `[name]-month5-github-workflow.yml`     | CI/CD pipeline        |
| `[name]-month5-deployment-url.md`       | Production URL        |
| `[name]-month5-monitoring.png`          | Dashboard screenshot  |

In this repo `[name]` = `lakshitha`; the packaged files live in [`../submission/`](../submission).

## Evaluation Preview

| Criteria      | Points | What Evaluators Look For               |
|---------------|--------|----------------------------------------|
| Dockerization | 25     | Multi-stage builds, optimized images   |
| CI/CD         | 25     | Tests, builds, deploys automatically   |
| Deployment    | 25     | Working HTTPS production URL           |
| Monitoring    | 15     | Logs, metrics, health checks           |
| Documentation | 10     | Clear setup instructions               |

## Tips for Success

1. **Test locally first** — `docker compose up` before deploying
2. **Use .dockerignore** — exclude `node_modules`, `.git`
3. **Secrets management** — never commit secrets
4. **Health checks** — configure for container orchestration
5. **Logging** — structured JSON logs are queryable
6. **Small images** — Alpine base, multi-stage builds
