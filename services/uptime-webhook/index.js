import { http } from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const storage = new Storage();
const gcBucketName = process.env.GC_BUCKET_NAME || 'cork-service-status';
const gcFolderName = process.env.GC_FOLDER_NAME || 'uptime-events';
const postgrestUrl = process.env.POSTGREST_URL;


http('gcWebhookCorkStatus', async (req, res) => {
  if ( process.env.DISABLE_AUTH !== 'true' && req.query.secret !== process.env.WEBHOOK_KEY ) {
    res.status(401).send('Unauthorized');
    return;
  }

  // for local development, can load previously stored events from the bucket
  if ( (req.query.action === 'loadEvents' || req.query.action === 'loadRandomEvents') && process.env.ENABLE_LOAD_EVENTS === 'true' ) {
    const events = await loadEventsFromBucket();
    if ( req.query.action === 'loadRandomEvents' ) {
      await assignRandomServiceUrl(events);
    }
    let processed = [];
    for (const event of events) {
      processed.push(await writeEventToPostgrest(event.payload));
    }
    processed = processed.filter(x => x);
    res.send(`Processed ${processed.length} events out of ${events.length} from bucket.`);
    return;
  }

  try {
    let payload = req.body;
    if( typeof payload === 'string' ) {
      payload = JSON.parse(payload);
    }

    if ( process.env.WRITE_TO_BUCKET === 'true' || req.query.writeToBucket === 'true' ) {
      await writeEventToBucket(payload);
    }

    if ( postgrestUrl ) {
      console.log('Writing event to PostgREST...');
      const success = await writeEventToPostgrest(payload);
      if (success) {
        console.log('Event successfully written to PostgREST.');
      } else {
        console.error('Failed to write event to PostgREST.');
        res.status(500).send('Failed to write event to PostgREST.');
        return;
      }
    } else {
      console.warn('PostgREST URL is not set. Skipping writing to PostgREST.');
      res.status(200).send('PostgREST URL is not set. Skipping writing to PostgREST.');
      return;
    }

    res.send(`Hook still in development. Payload received.`);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
    return;
  }
});

/**
 * @description Assigns a random service URL to each event based on the services available in PostgREST.
 * Used for local dev purposes.
 * @param {*} events
 * @returns
 */
async function assignRandomServiceUrl(events){
  console.log('Assigning random service URLs to events...');

  console.log('Fetching services from PostgREST:', postgrestUrl);
  let services = await fetch(`${postgrestUrl}/service_view_brief`);
  services = await services.json();

  if ( !services.some( s => s.service_properties.some( p => p.name === 'url' && p.values?.length ) ) ) {
    console.warn('No services with valid URLs found. Skipping URL assignment.');
    return events;
  }

  // url of event to randomly assigned service
  const urlMap = {};
  for ( let event of events ) {
    if ( event.payload ) event = event.payload;
    const ogUrl = event.incident?.resource?.labels?.host;
    if ( !ogUrl ) {
      console.warn('Event does not have a valid URL:', event);
      continue;
    }
    if ( urlMap[ogUrl] ) {
      event.incident.resource.labels.host = urlMap[ogUrl];
      continue;
    }

    while ( true ) {
      const randomService = services[Math.floor(Math.random() * services.length)];
      const urlProperty = randomService.service_properties.find(p => p.name === 'url' && p.values?.length);
      if (urlProperty && urlProperty.values[0]) {
        let v = urlProperty.values[0].value;
        urlMap[ogUrl] = v;
        event.incident.resource.labels.host = v;
        console.log(`Assigned URL ${v} to event with original URL ${ogUrl}`);
        break;
      }
    }

  }

  return events;
}

/**
 * @description Writes the Google Cloud Uptime event payload to PostgREST.
 * @param {Object} payload - The event payload to write to PostgREST.
 * @returns {Promise<boolean>} - Returns true if the event was successfully written to PostgREST, false otherwise.
 */
async function writeEventToPostgrest(payload) {
  if (!postgrestUrl) {
    console.warn('PostgREST URL is not set. Skipping writing to PostgREST.');
    return;
  }

 try {
    console.log('Writing event to PostgREST:', postgrestUrl);
    const response = await fetch(`${postgrestUrl}/rpc/process_gcloud_uptime_alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        // Add 'Authorization': 'Bearer <token>' TODO: add auth for pgfarm
      },
      body: JSON.stringify({payload})
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PostgREST Error:', {
        status: response.status,
        message: errorData.message,
        code: errorData.code
      });

      // Handle specific custom exception code from PostgreSQL
      if (errorData.code === 'P0001') {
        throw new Error(`Application-level error: ${errorData.message}`);
      } else {
        throw new Error(`Unhandled error: ${response.statusText}`);
      }
    }

    console.log('Uptime event submitted successfully to PostgREST:', postgrestUrl);
    return true;
  } catch (err) {
    console.error('Failed to submit alert:', err.message);
  }
}

/**
 * @description Loads uptime events from a Google Cloud Storage bucket.
 * @returns {Promise<Array>} An array of events loaded from the Google Cloud Storage bucket.
 */
async function loadEventsFromBucket(){
  let events = [];
  try {
    console.log('Loading events from bucket:', gcBucketName);
    const [files] = await storage.bucket(gcBucketName).getFiles({ prefix: `${gcFolderName}/` });
    files.sort((a, b) => new Date(a.metadata.timeCreated) - new Date(b.metadata.timeCreated));
    for (const file of files) {
      if (file.name === `${gcFolderName}/`) {
        // Skip the folder itself
        continue;
      }
      console.log(`Loading file: ${file.name}`);
      const [content] = await file.download();
      const contentStr = content.toString();
      if (contentStr.trim().length > 0) {
        try {
          const data = JSON.parse(contentStr);
          events.push(data);
        } catch (parseError) {
          console.error(`Error parsing JSON from file ${file.name}:`, parseError);
        }
      } else {
        console.warn(`File ${file.name} is empty, skipping.`);
      }
    }
  } catch (error) {
    console.error('Error loading events from bucket:', error);
    return [];
  }

  return events;
}

/**
 * @description Writes the event payload to a Google Cloud Storage bucket.
 * Mainly used for debugging and testing purposes, so we can easily inspect the payloads.
 * @param {*} payload
 */
async function writeEventToBucket(payload){
  try {
    console.log('Writing event to bucket:', gcBucketName);
    const bucket = storage.bucket(gcBucketName);
    const filename = `payload-${new Date().toISOString()}-${uuidv4()}.json`;
    const fullPath = `${gcFolderName}/${filename}`;
    const file = bucket.file(fullPath);

    const data = JSON.stringify({
      timestamp: new Date().toISOString(),
      payload: payload || {},
    });

    await file.save(data, {
      contentType: 'application/json'
    });

    console.log(`Event written to GC storage ${gcBucketName}/${gcFolderName} as ${filename}`);
  } catch (error) {
    console.error('Error writing event to bucket:', error);
  }
}
