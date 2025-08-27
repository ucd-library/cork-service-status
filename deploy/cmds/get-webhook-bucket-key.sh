#! /bin/bash
set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

mkdir -p "$ROOT_DIR/secrets"

gcloud --project=digital-ucdavis-edu secrets versions access latest --secret=cork-service-status-sa-key \
  > "$ROOT_DIR/secrets/gc-sa-key.json"
