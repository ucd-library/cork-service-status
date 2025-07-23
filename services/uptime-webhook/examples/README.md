# Google Cloud Monitoring Configuration Examples

This directory contains example configurations for setting up Google Cloud Monitoring uptime checks and alert policies.

## 1. Create Uptime Check

```yaml
# uptime-check.yaml - Example uptime check configuration
displayName: "Example Service API Uptime Check"
httpCheck:
  path: "/health"
  port: 443
  useSsl: true
  validateSsl: true
monitoredResource:
  type: "uptime_url"
  labels:
    project_id: "your-project-id"
    host: "example-api.library.ucdavis.edu"
timeout: "10s"
period: "60s"
checkerType: STATIC_IP_CHECKERS
selectedRegions:
  - "USA_OREGON"
  - "USA_IOWA"
  - "USA_VIRGINIA"
contentMatchers:
  - content: "healthy"
    matcher: CONTAINS_STRING
```

## 2. Create Alert Policy

```yaml
# alert-policy.yaml - Example alert policy configuration
displayName: "Example Service Uptime Alert"
conditions:
  - displayName: "Uptime check failed"
    conditionThreshold:
      filter: 'resource.type="uptime_check_id" AND resource.label.check_id="YOUR_CHECK_ID"'
      comparison: COMPARISON_TRUE
      thresholdValue: 1
      duration: "60s"
      aggregations:
        - alignmentPeriod: "1200s"
          perSeriesAligner: ALIGN_NEXT_OLDER
          crossSeriesReducer: REDUCE_COUNT_TRUE
          groupByFields:
            - "resource.label.project_id"
            - "resource.label.check_id"
notificationChannels:
  - "projects/YOUR_PROJECT_ID/notificationChannels/YOUR_WEBHOOK_CHANNEL_ID"
combiner: OR
enabled: true
```

## 3. Create Webhook Notification Channel

```bash
# Create webhook notification channel
gcloud alpha monitoring channels create \
  --display-name="Cork Uptime Webhook" \
  --type=webhook_tokenauth \
  --channel-labels=url=https://your-webhook-service.com/webhook/uptime \
  --user-labels=service=cork-service-status
```

## 4. gcloud Commands

### Create Uptime Check
```bash
gcloud monitoring uptime create \
  --display-name="Example Service API" \
  --hostname="example-api.library.ucdavis.edu" \
  --path="/health" \
  --timeout=10s \
  --period=60s \
  --ssl-enabled \
  --port=443
```

### Create Alert Policy
```bash
gcloud alpha monitoring policies create \
  --policy-from-file=alert-policy.yaml
```

### List Uptime Checks
```bash
gcloud monitoring uptime list
```

### List Alert Policies
```bash
gcloud alpha monitoring policies list
```

## 5. Webhook Configuration

When creating the webhook notification channel, use these settings:

- **URL**: `https://your-webhook-service.com/webhook/uptime`
- **Authentication**: Token-based
- **Token**: Your secure webhook token
- **Headers**:
  ```
  Authorization: Bearer your-webhook-token
  Content-Type: application/json
  ```

## 6. Testing

Test your webhook with a sample payload:

```bash
curl -X POST \
  -H "Authorization: Bearer your-webhook-token" \
  -H "Content-Type: application/json" \
  -d @sample-payload.json \
  https://your-webhook-service.com/webhook/uptime
```

## 7. Monitoring

Monitor your webhook service logs:

```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cork-uptime-webhook"

# Filter for errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cork-uptime-webhook AND severity>=ERROR"
```