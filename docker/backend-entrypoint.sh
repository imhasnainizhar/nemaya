#!/bin/sh
# Production entrypoint for the Medusa image.
#   start      → medusa start (role from MEDUSA_WORKER_MODE)
#   migrate    → run DB migrations + idempotent bootstrap (admin user, optional demo seed)
set -e
MEDUSA="node /srv/nemaya/node_modules/@medusajs/cli/cli.js"

case "$1" in
  start)
    exec $MEDUSA start
    ;;
  migrate)
    $MEDUSA db:migrate
    exec $MEDUSA exec ./src/scripts/bootstrap.js
    ;;
  *)
    exec "$@"
    ;;
esac
