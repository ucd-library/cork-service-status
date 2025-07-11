#! /bin/bash
set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$CMDS_DIR/../.."

if [ $# -ne 1 ]; then
  echo "Usage: $0 <number-of-services>"
  exit 1
fi

APP_DIR="deploy/compose/cork-service-status-local-dev"
NUM_SERVICES=$1
cd "$APP_DIR" && docker compose exec app node data-seeder/seed.js --services "$NUM_SERVICES"
