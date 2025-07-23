import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:8080/webhook/uptime';
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'default-token';

// Sample Google Cloud uptime alert payload (OPEN state - service down)
const sampleDownAlert = {
  "incident": {
    "incident_id": "0.mzaw5l8dr2hb",
    "resource_id": "",
    "resource_name": "example-service-api",
    "resource": {
      "type": "uptime_check_id",
      "resource_name": "example-service-api"
    },
    "started_at": new Date().toISOString(),
    "ended_at": null,
    "policy_name": "Example Service Uptime Policy",
    "policy_user_labels": {
      "service": "example-api",
      "environment": "production"
    },
    "condition_name": "Example Service Uptime Check",
    "condition": {
      "displayName": "Example Service Uptime Check",
      "conditionThreshold": {
        "filter": "resource.type=\"uptime_check_id\"",
        "comparison": "COMPARISON_TRUE",
        "thresholdValue": 1,
        "duration": "60s",
        "aggregations": [
          {
            "alignmentPeriod": "1200s",
            "perSeriesAligner": "ALIGN_NEXT_OLDER",
            "crossSeriesReducer": "REDUCE_COUNT_TRUE",
            "groupByFields": [
              "resource.label.project_id",
              "resource.label.check_id"
            ]
          }
        ]
      }
    },
    "url": "https://example-api.library.ucdavis.edu/health",
    "summary": "Example Service API is down - uptime check failed",
    "state": "OPEN"
  },
  "version": "1.2"
};

// Sample Google Cloud uptime alert payload (CLOSED state - service up)
const sampleUpAlert = {
  ...sampleDownAlert,
  "incident": {
    ...sampleDownAlert.incident,
    "ended_at": new Date().toISOString(),
    "summary": "Example Service API is back up - uptime check passed",
    "state": "CLOSED"
  }
};

async function testWebhook(payload, description, queryParams = '') {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`URL: ${WEBHOOK_URL}${queryParams}`);
    
    const response = await fetch(`${WEBHOOK_URL}${queryParams}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WEBHOOK_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, responseData);
    
    if (response.ok) {
      console.log('✅ Success');
    } else {
      console.log('❌ Failed');
    }
    
    return { success: response.ok, data: responseData };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testHealthEndpoint() {
  try {
    console.log('\n🏥 Testing health endpoint...');
    const healthUrl = WEBHOOK_URL.replace('/webhook/uptime', '/health');
    
    const response = await fetch(healthUrl);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed');
    }
    
    return response.ok;
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚦 Starting webhook tests...');
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Using token: ${WEBHOOK_TOKEN.substring(0, 8)}...`);
  
  // Test health endpoint first
  await testHealthEndpoint();
  
  // Test service down alert
  await testWebhook(sampleDownAlert, 'Service Down Alert');
  
  // Test service up alert  
  await testWebhook(sampleUpAlert, 'Service Up Alert');
  
  // Test with specific service ID
  await testWebhook(sampleDownAlert, 'Down Alert with Service ID', '?service_id=123e4567-e89b-12d3-a456-426614174000');
  
  // Test with GCS option
  await testWebhook(sampleUpAlert, 'Up Alert with GCS', '?use_gcs=true');
  
  // Test invalid token
  console.log('\n🧪 Testing: Invalid token');
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sampleDownAlert)
    });
    
    console.log(`Status: ${response.status}`);
    if (response.status === 403) {
      console.log('✅ Invalid token correctly rejected');
    } else {
      console.log('❌ Invalid token should have been rejected');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n🏁 Tests completed');
}

// Command line arguments
const args = process.argv.slice(2);
if (args.includes('--health')) {
  testHealthEndpoint();
} else if (args.includes('--down')) {
  testWebhook(sampleDownAlert, 'Service Down Alert');
} else if (args.includes('--up')) {
  testWebhook(sampleUpAlert, 'Service Up Alert');
} else {
  runTests();
}