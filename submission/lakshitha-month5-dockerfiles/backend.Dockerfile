# syntax=docker/dockerfile:1

# ---- deps: production dependencies only (cached until package*.json changes) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---- test: dev dependencies + lint + unit tests (`docker build --target test .`) ----
FROM node:22-alpine AS test
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run lint && npm test

# ---- runtime: minimal image, non-root ----
FROM node:22-alpine AS runtime
ARG APP_VERSION=dev
ENV NODE_ENV=production \
    PORT=3000 \
    APP_VERSION=${APP_VERSION}
WORKDIR /app

# npm/corepack aren't needed at runtime — removing them takes their CVEs out of the final
# filesystem that scanners (Trivy) see and that an attacker could use
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json swagger.yaml ./
COPY --chown=node:node src ./src
COPY --chown=node:node database ./database

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health/live || exit 1

# exec form → node is PID 1 and receives SIGTERM for graceful shutdown
CMD ["node", "src/server.js"]
