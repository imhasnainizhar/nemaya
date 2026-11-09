# Local development image for both apps (source is bind-mounted, deps live in volumes).
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@12.18.0

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    MEDUSA_DISABLE_TELEMETRY=true

# NOTE: not /app — Medusa serves its admin under /app and a matching path breaks Vite dev imports
WORKDIR /workspace
