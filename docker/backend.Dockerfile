# Production image for the Medusa backend.
# One image, two roles: MEDUSA_WORKER_MODE=server (API + admin) or worker (jobs/subscribers).
#
#   docker build -f docker/backend.Dockerfile -t nemaya-backend .
#
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN npm install -g pnpm@12.18.0 turbo@2.11.10
ENV NEXT_TELEMETRY_DISABLED=1 MEDUSA_DISABLE_TELEMETRY=true

# 1) keep only what the backend needs from the monorepo
FROM base AS pruner
WORKDIR /srv/nemaya
COPY . .
RUN turbo prune @nemaya/backend --docker

# 2) install + build
FROM base AS builder
WORKDIR /srv/nemaya
COPY --from=pruner /srv/nemaya/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /srv/nemaya/out/full/ .
# Admin dashboard talks to the API on the same origin unless overridden at build time
ARG MEDUSA_BACKEND_URL=/
ARG ADMIN_DISABLED=false
ENV MEDUSA_BACKEND_URL=${MEDUSA_BACKEND_URL} ADMIN_DISABLED=${ADMIN_DISABLED}
RUN pnpm --filter @nemaya/backend build
# drop dev dependencies (node_modules is hoisted at /srv/nemaya/node_modules)
RUN pnpm install --prod --frozen-lockfile

# 3) slim runtime
FROM node:${NODE_VERSION}-bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl tini \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production MEDUSA_DISABLE_TELEMETRY=true
WORKDIR /srv/nemaya
COPY --chown=node:node --from=builder /srv/nemaya/node_modules ./node_modules
COPY --chown=node:node --from=builder /srv/nemaya/packages ./packages
COPY --chown=node:node --from=builder /srv/nemaya/apps/backend/package.json ./apps/backend/package.json
COPY --chown=node:node --from=builder /srv/nemaya/apps/backend/.medusa/server ./apps/backend/.medusa/server
COPY docker/backend-entrypoint.sh /usr/local/bin/backend-entrypoint
RUN chmod +x /usr/local/bin/backend-entrypoint && mkdir -p /srv/nemaya/apps/backend/node_modules && chown node:node /srv/nemaya /srv/nemaya/apps /srv/nemaya/apps/backend /srv/nemaya/apps/backend/node_modules
USER node
WORKDIR /srv/nemaya/apps/backend/.medusa/server
EXPOSE 9000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD [ "$MEDUSA_WORKER_MODE" = "worker" ] || curl -fsS http://127.0.0.1:9000/health || exit 1
ENTRYPOINT ["/usr/bin/tini", "--", "backend-entrypoint"]
CMD ["start"]
