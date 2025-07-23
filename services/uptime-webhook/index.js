import express from 'express';
import fetch from 'node-fetch';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple logger with fallback
const logger = {
  info: (msg, meta) => console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : ''),
  warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : ''),
  error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta ? JSON.stringify(meta) : '')
};

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 8080;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'default-token';
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://localhost:3001';
const USE_GCS = process.env.USE_GCS === 'true';
const GCS_BUCKET = process.env.GCS_BUCKET;
const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID;

// Initialize Google Cloud Storage client if needed
let gcsStorage, gcsBucket;
if (USE_GCS && GCS_BUCKET && GCS_PROJECT_ID) {
  gcsStorage = new Storage({ projectId: GCS_PROJECT_ID });
  gcsBucket = gcsStorage.bucket(GCS_BUCKET);
  logger.info('GCS initialized', { bucket: GCS_BUCKET, project: GCS_PROJECT_ID });
}

// Token authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  if (token !== WEBHOOK_TOKEN) {
    logger.warn('Invalid token attempt', { 
      providedToken: token.substring(0, 8) + '...',
      ip: req.ip 
    });
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  next();
};

// Parse Google Cloud uptime alert payload
const parseUptimeAlert = (payload) => {
  try {
    const incident = payload.incident;
    if (!incident) {
      throw new Error('No incident data in payload');
    }

    // Map Google Cloud incident state to our event types
    let eventType = 'up';
    if (incident.state === 'OPEN') {
      eventType = 'down';
    } else if (incident.state === 'CLOSED') {
      eventType = 'up';
    }

    const parsedEvent = {
      event_type: eventType,
      event_payload: {
        source: 'google-cloud-uptime',
        incident_id: incident.incident_id,
        policy_name: incident.policy_name,
        condition_name: incident.condition_name,
        resource_name: incident.resource?.resource_name || incident.resource_name,
        state: incident.state,
        started_at: incident.started_at,
        ended_at: incident.ended_at,
        url: incident.url,
        summary: incident.summary,
        raw_payload: payload
      }
    };

    return parsedEvent;
  } catch (error) {
    logger.error('Failed to parse uptime alert payload', { error: error.message, payload });
    throw error;
  }
};

// Write event to PostgREST
const writeToPostgrest = async (eventData, serviceId) => {
  try {
    const requestBody = {
      ...eventData,
      service_id: serviceId
    };

    const response = await fetch(`${POSTGREST_URL}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PostgREST request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    logger.info('Event written to PostgREST', { eventId: result[0]?.event_id, serviceId });
    return result[0];
  } catch (error) {
    logger.error('Failed to write to PostgREST', { error: error.message, serviceId });
    throw error;
  }
};

// Write event to Google Cloud Storage
const writeToGCS = async (eventData, serviceId) => {
  try {
    if (!gcsBucket) {
      throw new Error('GCS not configured');
    }

    const filename = `uptime-alerts/${new Date().toISOString()}-${serviceId || 'unknown'}-${eventData.event_payload.incident_id}.json`;
    const file = gcsBucket.file(filename);
    
    const dataToStore = {
      ...eventData,
      service_id: serviceId,
      stored_at: new Date().toISOString()
    };

    await file.save(JSON.stringify(dataToStore, null, 2), {
      metadata: {
        contentType: 'application/json'
      }
    });

    logger.info('Event written to GCS', { filename, serviceId });
    return { filename, bucket: GCS_BUCKET };
  } catch (error) {
    logger.error('Failed to write to GCS', { error: error.message, serviceId });
    throw error;
  }
};

// Find service by resource name or URL
const findServiceId = async (resourceName, url) => {
  try {
    // Try to find service by matching URL or resource name
    const searchUrl = `${POSTGREST_URL}/service_view_full?or=(name.eq.${encodeURIComponent(resourceName)},service_properties->>url.eq.${encodeURIComponent(url)})`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`Service search failed: ${response.status}`);
    }

    const services = await response.json();
    if (services && services.length > 0) {
      logger.info('Found matching service', { serviceId: services[0].service_id, resourceName, url });
      return services[0].service_id;
    }

    logger.warn('No matching service found', { resourceName, url });
    return null;
  } catch (error) {
    logger.error('Failed to find service', { error: error.message, resourceName, url });
    return null;
  }
};

// Main webhook endpoint
app.post('/webhook/uptime', authenticateToken, async (req, res) => {
  try {
    logger.info('Received uptime webhook', { 
      headers: req.headers,
      bodySize: JSON.stringify(req.body).length 
    });

    // Parse the uptime alert
    const eventData = parseUptimeAlert(req.body);
    
    // Check if we should use GCS (global setting or per-request override)
    const useGcsForThisRequest = req.query.use_gcs === 'true' || (USE_GCS && req.query.use_gcs !== 'false');
    
    // Find service ID if possible
    const resourceName = eventData.event_payload.resource_name;
    const url = eventData.event_payload.url;
    const serviceId = req.query.service_id || await findServiceId(resourceName, url);

    let result;
    if (useGcsForThisRequest) {
      result = await writeToGCS(eventData, serviceId);
    } else {
      if (!serviceId) {
        return res.status(400).json({ 
          error: 'No service_id provided and unable to find matching service',
          resource_name: resourceName,
          url: url
        });
      }
      result = await writeToPostgrest(eventData, serviceId);
    }

    res.json({
      success: true,
      event_type: eventData.event_type,
      service_id: serviceId,
      storage_method: useGcsForThisRequest ? 'gcs' : 'postgrest',
      result
    });

  } catch (error) {
    logger.error('Webhook processing failed', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    config: {
      postgrest_url: POSTGREST_URL,
      use_gcs: USE_GCS,
      gcs_bucket: GCS_BUCKET,
      gcs_configured: !!gcsBucket
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('Uptime webhook service started', { 
    port: PORT,
    postgrest_url: POSTGREST_URL,
    use_gcs: USE_GCS,
    gcs_bucket: GCS_BUCKET
  });
});

export default app;