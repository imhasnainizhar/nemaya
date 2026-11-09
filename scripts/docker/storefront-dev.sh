#!/bin/sh
# Dev entrypoint for the storefront container.
set -e
cd /workspace/apps/storefront
if [ -z "$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" ]; then
  echo "▸ waiting for publishable key from backend bootstrap…"
  i=0
  while [ ! -s /shared/publishable-key ] && [ $i -lt 120 ]; do sleep 2; i=$((i+1)); done
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$(cat /shared/publishable-key)
  export NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
fi
echo "▸ starting next dev on :8000"
# Turbopack ignores polling; on Windows/macOS bind mounts use webpack + polling for hot reload
if [ "$WATCHPACK_POLLING" = "true" ]; then
  exec pnpm next dev --webpack -p 8000 -H 0.0.0.0
fi
exec pnpm next dev -p 8000 -H 0.0.0.0
