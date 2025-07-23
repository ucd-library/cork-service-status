# Cork Service Status - Uptime Webhook

A Google Cloud Run service that receives uptime alert webhooks from Google Cloud Monitoring and writes events to the Cork Service Status database.

## Features

- ✅ Token-based authentication for webhook security
- ✅ Writes uptime events to PostgREST API
- ✅ Optional Google Cloud Storage backup
- ✅ Automatic service matching by URL/resource name
- ✅ Local development environment
- ✅ Comprehensive testing utilities
- ✅ Cloud Run deployment scripts

## Quick Start

### Local Development

1. **Setup environment:**
   ```bash
   cd services/uptime-webhook
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Install and start:**
   ```bash
   ./dev.sh install
   ./dev.sh start
   ```

3. **Test the webhook:**
   ```bash
   # In another terminal
   ./dev.sh test
   ```

### Google Cloud Run Deployment

1. **Set environment variables:**
   ```bash
   export GCP_PROJECT_ID="your-project-id"
   export WEBHOOK_TOKEN="your-secure-token"
   export POSTGREST_URL="https://your-postgrest-api.com"
   ```

2. **Deploy:**
   ```bash
   cd deploy
   ./deploy.sh
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `8080` |
| `WEBHOOK_TOKEN` | Authentication token | Yes | - |
| `POSTGREST_URL` | PostgREST API endpoint | Yes* | - |
| `USE_GCS` | Use Google Cloud Storage | No | `false` |
| `GCS_BUCKET` | GCS bucket name | Yes** | - |
| `GCS_PROJECT_ID` | Google Cloud project ID | Yes** | - |

*Required when `USE_GCS` is false  
**Required when `USE_GCS` is true

### Google Cloud Storage Setup

If using GCS backup instead of or in addition to PostgREST:

1. Create a GCS bucket
2. Set up service account with Storage Admin permissions
3. Set `GOOGLE_APPLICATION_CREDENTIALS` or use Cloud Run's default service account

## API Endpoints

### POST /webhook/uptime

Receives Google Cloud uptime alert webhooks.

**Headers:**
- `Authorization: Bearer <WEBHOOK_TOKEN>`
- `Content-Type: application/json`

**Query Parameters:**
- `service_id` (optional) - Override service ID
- `use_gcs` (optional) - Override GCS setting for this request

**Request Body:** Google Cloud uptime alert payload

**Response:**
```json
{
  "success": true,
  "event_type": "down",
  "service_id": "uuid",
  "storage_method": "postgrest",
  "result": {...}
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "config": {
    "postgrest_url": "http://localhost:3001",
    "use_gcs": false,
    "gcs_bucket": null,
    "gcs_configured": false
  }
}
```

## Google Cloud Uptime Alert Setup

1. **Create Uptime Check:**
   - Go to Google Cloud Console > Monitoring > Uptime checks
   - Create new uptime check for your service
   - Configure check frequency and failure criteria

2. **Create Alert Policy:**
   - Go to Alerting > Policies
   - Create new policy
   - Add condition for uptime check failures
   - Set up notification channel (webhook)

3. **Configure Webhook Notification:**
   - Type: Webhook
   - URL: `https://your-webhook-service.com/webhook/uptime`
   - Headers: `Authorization: Bearer your-webhook-token`

## Event Data Structure

Events are stored in the `cork_status.event` table with this structure:

```sql
event_id UUID PRIMARY KEY,
service_id UUID NOT NULL,
event_type event_type NOT NULL, -- 'up' or 'down'
event_payload jsonb,
submitted_by UUID,
created_at timestamp
```

The `event_payload` contains:
```json
{
  "source": "google-cloud-uptime",
  "incident_id": "string",
  "policy_name": "string",
  "condition_name": "string",
  "resource_name": "string",
  "state": "OPEN|CLOSED",
  "started_at": "timestamp",
  "ended_at": "timestamp",
  "url": "string",
  "summary": "string",
  "raw_payload": {...}
}
```

## Testing

### Local Testing

```bash
# Test health endpoint
./dev.sh test --health

# Test service down alert
./dev.sh test --down

# Test service up alert  
./dev.sh test --up

# Run comprehensive tests
./dev.sh test
```

### Docker Testing

```bash
# Test with Docker Compose
./dev.sh docker-test
```

### GCS Utilities

```bash
# List alerts in GCS bucket
./dev.sh gcs-list

# Process GCS alerts and assign to random services
./dev.sh gcs-process

# List available services
./dev.sh services
```

## Development Commands

```bash
# Start development server
./dev.sh start

# Start with Docker
./dev.sh docker

# Install dependencies
./dev.sh install

# Build Docker image
./dev.sh build

# View logs
./dev.sh logs

# Clean up
./dev.sh clean
```

## Service Matching

The webhook automatically tries to match uptime alerts to services by:

1. **Resource Name:** Matches `incident.resource_name` to service `name`
2. **URL:** Matches `incident.url` to service property `url`

If no match is found:
- With PostgREST: Returns 400 error (unless `service_id` query param provided)
- With GCS: Stores with `service_id: null` for later processing

## Troubleshooting

### Common Issues

1. **403 Forbidden**
   - Check `WEBHOOK_TOKEN` matches the Authorization header
   - Ensure header format: `Authorization: Bearer <token>`

2. **Service Not Found**
   - Use `service_id` query parameter to override matching
   - Check service exists in database
   - Verify URL/resource name matching logic

3. **PostgREST Connection Failed**
   - Verify `POSTGREST_URL` is correct and accessible
   - Check network connectivity
   - Ensure PostgREST is running and healthy

4. **GCS Permission Denied**
   - Verify service account has Storage Admin role
   - Check `GOOGLE_APPLICATION_CREDENTIALS` path
   - Ensure bucket exists and is accessible

### Logging

The service uses structured logging with different levels:
- `info` - Normal operations
- `warn` - Warning conditions
- `error` - Error conditions

View logs:
```bash
# Local development
./dev.sh logs

# Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cork-uptime-webhook"
```