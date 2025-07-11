#! /bin/bash
set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$(cd "$CMDS_DIR/../.." && pwd)"
LOCAL_DEV_DIR="$(cd "$ROOT_DIR/deploy/compose/cork-service-status-local-dev" && pwd)"
