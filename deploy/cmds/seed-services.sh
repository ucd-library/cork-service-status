#! /bin/bash
set -e

if [ $# -ne 1 ]; then
  echo "Usage: $0 <number-of-services>"
  exit 1
fi

CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

NUM_SERVICES=$1
cd "$LOCAL_DEV_DIR" && docker compose exec app node data-seeder/seed.js --services "$NUM_SERVICES"
