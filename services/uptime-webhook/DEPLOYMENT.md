# Google Cloud Run Deployment Guide

This guide walks you through deploying the Cork Uptime Webhook service to Google Cloud Run.

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Docker** (for local testing)
4. **Enable required APIs:**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable monitoring.googleapis.com
   ```

## Step 1: Project Setup

1. **Set your project:**
   ```bash
   export GCP_PROJECT_ID="your-project-id"
   gcloud config set project $GCP_PROJECT_ID
   ```

2. **Create Artifact Registry repository:**
   ```bash
   gcloud artifacts repositories create cork-service-status \
     --repository-format=docker \
     --location=us-central1
   ```

## Step 2: Configure Environment

1. **Set environment variables:**
   ```bash
   export WEBHOOK_TOKEN="your-secure-webhook-token-$(openssl rand -hex 16)"
   export POSTGREST_URL="https://your-postgrest-api.com"
   export USE_GCS="false"  # or "true" if using GCS backup
   export GCS_BUCKET="your-uptime-alerts-bucket"  # if using GCS
   export REGION="us-central1"
   export SERVICE_NAME="cork-uptime-webhook"
   ```

2. **Create GCS bucket (if using GCS backup):**
   ```bash
   # Only if USE_GCS="true"
   gsutil mb gs://$GCS_BUCKET
   ```

## Step 3: Deploy to Cloud Run

1. **Navigate to webhook directory:**
   ```bash
   cd services/uptime-webhook
   ```

2. **Deploy using the deploy script:**
   ```bash
   ./deploy/deploy.sh
   ```

   Or deploy manually:
   ```bash
   # Build and push image
   gcloud builds submit --tag us-central1-docker.pkg.dev/$GCP_PROJECT_ID/cork-service-status/$SERVICE_NAME

   # Deploy to Cloud Run
   gcloud run deploy $SERVICE_NAME \
     --image us-central1-docker.pkg.dev/$GCP_PROJECT_ID/cork-service-status/$SERVICE_NAME \
     --platform managed \
     --region $REGION \
     --allow-unauthenticated \
     --set-env-vars "WEBHOOK_TOKEN=$WEBHOOK_TOKEN" \
     --set-env-vars "POSTGREST_URL=$POSTGREST_URL" \
     --set-env-vars "USE_GCS=$USE_GCS" \
     --set-env-vars "GCS_BUCKET=$GCS_BUCKET" \
     --set-env-vars "GCS_PROJECT_ID=$GCP_PROJECT_ID" \
     --memory 512Mi \
     --cpu 1 \
     --timeout 60s \
     --max-instances 10 \
     --min-instances 0
   ```

## Step 4: Configure Google Cloud Monitoring

1. **Create notification channel:**
   ```bash
   SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
   
   gcloud alpha monitoring channels create \
     --display-name="Cork Uptime Webhook" \
     --type=webhook_tokenauth \
     --channel-labels=url=$SERVICE_URL/webhook/uptime \
     --user-labels=service=cork-service-status
   ```

2. **Create uptime check:**
   ```bash
   gcloud monitoring uptime create \
     --display-name="Your Service Name" \
     --hostname="your-service.com" \
     --path="/health" \
     --timeout=10s \
     --period=60s \
     --ssl-enabled \
     --port=443
   ```

3. **Create alert policy:**
   - Go to Cloud Console > Monitoring > Alerting
   - Create new policy
   - Add condition for uptime check failure
   - Add your webhook notification channel

## Step 5: Test Deployment

1. **Test health endpoint:**
   ```bash
   SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
   curl $SERVICE_URL/health
   ```

2. **Test webhook endpoint:**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $WEBHOOK_TOKEN" \
     -H "Content-Type: application/json" \
     -d @examples/sample-down-payload.json \
     "$SERVICE_URL/webhook/uptime?service_id=your-service-id"
   ```

## Step 6: Monitor and Maintain

1. **View logs:**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME"
   ```

2. **Monitor metrics:**
   - Go to Cloud Console > Cloud Run > Your Service
   - View metrics and logs

3. **Update service:**
   ```bash
   # Rebuild and redeploy
   ./deploy/deploy.sh
   ```

## Troubleshooting

### Common Issues

1. **403 Forbidden:**
   - Check webhook token configuration
   - Verify Authorization header format

2. **Service Not Found:**
   - Ensure service exists in database
   - Use `service_id` parameter to override

3. **PostgREST Connection Failed:**
   - Verify POSTGREST_URL is correct
   - Check network connectivity

4. **GCS Permission Denied:**
   - Verify service account permissions
   - Check bucket exists and is accessible

### Useful Commands

```bash
# View service details
gcloud run services describe $SERVICE_NAME --region $REGION

# Update environment variables
gcloud run services update $SERVICE_NAME --region $REGION \
  --update-env-vars WEBHOOK_TOKEN=new-token

# View logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME"

# Delete service
gcloud run services delete $SERVICE_NAME --region $REGION
```

## Security Considerations

1. **Webhook Token:**
   - Use a strong, randomly generated token
   - Rotate tokens periodically
   - Store securely (never commit to code)

2. **Network Security:**
   - Consider VPC connector for private PostgREST access
   - Use HTTPS for all endpoints

3. **IAM Permissions:**
   - Use least privilege principle
   - Create dedicated service accounts

4. **Monitoring:**
   - Set up alerting for webhook failures
   - Monitor for suspicious authentication attempts

## Cost Optimization

1. **Resource Limits:**
   - Adjust memory/CPU based on usage
   - Set appropriate min/max instances

2. **Request Pricing:**
   - Cloud Run charges per request
   - Monitor usage patterns

3. **Storage Costs:**
   - If using GCS, implement lifecycle policies
   - Consider data retention requirements