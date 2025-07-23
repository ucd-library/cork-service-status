#! /bin/bash
set -e

CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

gcloud run deploy cork-service-status-uptime-webhook \
  --source "$SERVICES_DIR/uptime-webhook" \
  --function gcWebhookCorkStatus \
  --base-image nodejs22 \
  --project digital-ucdavis-edu \
  --set-secrets=WEBHOOK_KEY=cork-service-status-webhook-key:latest \
  --allow-unauthenticated
