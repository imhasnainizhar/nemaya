#!/bin/sh
# Dev entrypoint for the backend container.
set -e
cd /workspace/apps/backend
echo "▸ running migrations"
pnpm medusa db:migrate
echo "▸ bootstrap (seed demo data, admin user, publishable key)"
pnpm medusa exec ./src/scripts/bootstrap.ts
echo "▸ starting medusa develop on :9000"
exec pnpm medusa develop
