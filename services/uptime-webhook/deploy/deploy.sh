#!/bin/bash

# Google Cloud Run Deployment Script for Uptime Webhook
set -e

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"your-gcp-project-id"}
SERVICE_NAME=${SERVICE_NAME:-"cork-uptime-webhook"}
REGION=${REGION:-"us-central1"}
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/cork-service-status/${SERVICE_NAME}"

# Environment variables for the service
WEBHOOK_TOKEN=${WEBHOOK_TOKEN:-""}
POSTGREST_URL=${POSTGREST_URL:-""}
USE_GCS=${USE_GCS:-"false"}
GCS_BUCKET=${GCS_BUCKET:-""}

echo "🚀 Deploying Uptime Webhook to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"

# Validate required environment variables
if [ -z "$WEBHOOK_TOKEN" ]; then
    echo "❌ WEBHOOK_TOKEN environment variable is required"
    exit 1
fi

if [ -z "$POSTGREST_URL" ] && [ "$USE_GCS" != "true" ]; then
    echo "❌ POSTGREST_URL is required when USE_GCS is not true"
    exit 1
fi

if [ "$USE_GCS" = "true" ] && [ -z "$GCS_BUCKET" ]; then
    echo "❌ GCS_BUCKET is required when USE_GCS is true"
    exit 1
fi

# Build and push Docker image
echo "📦 Building Docker image..."
gcloud builds submit --tag $IMAGE_NAME .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "WEBHOOK_TOKEN=$WEBHOOK_TOKEN" \
    --set-env-vars "POSTGREST_URL=$POSTGREST_URL" \
    --set-env-vars "USE_GCS=$USE_GCS" \
    --set-env-vars "GCS_BUCKET=$GCS_BUCKET" \
    --set-env-vars "GCS_PROJECT_ID=$PROJECT_ID" \
    --memory 512Mi \
    --cpu 1 \
    --timeout 60s \
    --max-instances 10 \
    --min-instances 0

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "✅ Deployment complete!"
echo "Service URL: $SERVICE_URL"
echo ""
echo "📝 Webhook Endpoint: $SERVICE_URL/webhook/uptime"
echo "📊 Health Check: $SERVICE_URL/health"
echo ""
echo "🔑 Example webhook request:"
echo "curl -X POST $SERVICE_URL/webhook/uptime \\"
echo "  -H 'Authorization: Bearer $WEBHOOK_TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"incident\": {...}}'"