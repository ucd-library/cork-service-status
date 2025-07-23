import { Storage } from '@google-cloud/storage';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GCS_BUCKET = process.env.GCS_BUCKET;
const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID;
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://localhost:3001';

if (!GCS_BUCKET || !GCS_PROJECT_ID) {
  console.error('❌ GCS_BUCKET and GCS_PROJECT_ID environment variables are required');
  process.exit(1);
}

const storage = new Storage({ projectId: GCS_PROJECT_ID });
const bucket = storage.bucket(GCS_BUCKET);

// Get all services from the database
async function getAllServices() {
  try {
    const response = await fetch(`${POSTGREST_URL}/service_view_full`);
    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.status}`);
    }
    
    const services = await response.json();
    console.log(`📋 Found ${services.length} services in database`);
    return services;
  } catch (error) {
    console.error('❌ Failed to fetch services:', error.message);
    throw error;
  }
}

// Get random service from the list
function getRandomService(services) {
  return services[Math.floor(Math.random() * services.length)];
}

// Read uptime alert files from GCS bucket
async function readUptimeAlertsFromGCS() {
  try {
    console.log(`📁 Reading uptime alerts from GCS bucket: ${GCS_BUCKET}`);
    
    const [files] = await bucket.getFiles({
      prefix: 'uptime-alerts/',
      delimiter: '/'
    });
    
    console.log(`📄 Found ${files.length} uptime alert files`);
    
    const alerts = [];
    for (const file of files) {
      try {
        const [content] = await file.download();
        const alertData = JSON.parse(content.toString());
        alerts.push({
          filename: file.name,
          data: alertData
        });
      } catch (error) {
        console.warn(`⚠️ Failed to read file ${file.name}: ${error.message}`);
      }
    }
    
    return alerts;
  } catch (error) {
    console.error('❌ Failed to read from GCS:', error.message);
    throw error;
  }
}

// Write event to PostgREST with random service assignment
async function writeEventToPostgrest(eventData, serviceId) {
  try {
    const requestBody = {
      service_id: serviceId,
      event_type: eventData.event_type,
      event_payload: {
        ...eventData.event_payload,
        randomly_assigned: true,
        original_service_id: eventData.service_id,
        processed_at: new Date().toISOString()
      }
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
    return result[0];
  } catch (error) {
    console.error('❌ Failed to write to PostgREST:', error.message);
    throw error;
  }
}

// Main function to process GCS alerts and assign to random services
async function processGCSAlertsToRandomServices() {
  try {
    console.log('🚀 Starting GCS alerts processing with random service assignment...');
    
    // Get all services and alerts
    const [services, alerts] = await Promise.all([
      getAllServices(),
      readUptimeAlertsFromGCS()
    ]);
    
    if (services.length === 0) {
      console.error('❌ No services found in database');
      return;
    }
    
    if (alerts.length === 0) {
      console.log('ℹ️ No uptime alerts found in GCS bucket');
      return;
    }
    
    console.log(`🎲 Processing ${alerts.length} alerts and randomly assigning to ${services.length} services...`);
    
    let processed = 0;
    let errors = 0;
    
    for (const alert of alerts) {
      try {
        // Skip if already processed (has random assignment marker)
        if (alert.data.event_payload?.randomly_assigned) {
          console.log(`⏭️ Skipping already processed alert: ${alert.filename}`);
          continue;
        }
        
        // Get random service
        const randomService = getRandomService(services);
        
        // Write to PostgREST
        const result = await writeEventToPostgrest(alert.data, randomService.service_id);
        
        console.log(`✅ Processed ${alert.filename} -> Service: ${randomService.name} (${randomService.service_id})`);
        console.log(`   Event ID: ${result.event_id}, Type: ${result.event_type}`);
        
        processed++;
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to process ${alert.filename}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Processing Summary:`);
    console.log(`   Total alerts: ${alerts.length}`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Skipped: ${alerts.length - processed - errors}`);
    
  } catch (error) {
    console.error('❌ Failed to process GCS alerts:', error.message);
    process.exit(1);
  }
}

// List GCS alerts without processing
async function listGCSAlerts() {
  try {
    const alerts = await readUptimeAlertsFromGCS();
    
    console.log(`\n📋 GCS Uptime Alerts Summary:`);
    alerts.forEach((alert, index) => {
      const data = alert.data;
      const isProcessed = data.event_payload?.randomly_assigned ? '✅' : '⏳';
      console.log(`${index + 1}. ${isProcessed} ${alert.filename}`);
      console.log(`   Type: ${data.event_type}`);
      console.log(`   Resource: ${data.event_payload?.resource_name}`);
      console.log(`   State: ${data.event_payload?.state}`);
      console.log(`   Service ID: ${data.service_id || 'none'}`);
      if (data.event_payload?.randomly_assigned) {
        console.log(`   Originally: ${data.event_payload.original_service_id || 'unknown'}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to list GCS alerts:', error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
    listGCSAlerts();
    break;
  case 'process':
    processGCSAlertsToRandomServices();
    break;
  case 'services':
    getAllServices().then(services => {
      console.log('📋 Available Services:');
      services.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name} (${service.service_id}) - Status: ${service.service_status}`);
      });
    }).catch(console.error);
    break;
  default:
    console.log(`
🔧 GCS Uptime Alerts Utility

Usage: node gcs-reader.js <command>

Commands:
  list     - List all uptime alerts in GCS bucket
  process  - Process GCS alerts and randomly assign to existing services
  services - List all services in the database

Environment variables required:
  GCS_BUCKET      - Google Cloud Storage bucket name
  GCS_PROJECT_ID  - Google Cloud Project ID
  POSTGREST_URL   - PostgREST API URL (default: http://localhost:3001)

Examples:
  node gcs-reader.js list
  node gcs-reader.js process
  node gcs-reader.js services
    `);
}