# syntax=docker/dockerfile:1

# ---- build: compile the SPA (cached until package*.json changes) ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

# ---- runtime: static files + reverse proxy, no Node in the final image ----
FROM nginx:1.29-alpine AS runtime

# defaults for docker compose; the cloud host overrides them
# (NGINX_RESOLVER is derived from /etc/resolv.conf by 15-resolver.envsh)
ENV PORT=80 \
    API_UPSTREAM=http://backend:3000 \
    NGINX_ENVSUBST_FILTER="^(PORT|API_UPSTREAM|NGINX_RESOLVER)$"

# the entrypoint only sources *.envsh files that are executable (not guaranteed by a git checkout)
COPY --chmod=755 nginx/15-resolver.envsh /docker-entrypoint.d/15-resolver.envsh
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1

# base image CMD: nginx -g 'daemon off;' (entrypoint renders the template first)
