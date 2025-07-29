import { http } from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

const storage = new Storage();
const gcBucketName = process.env.GC_BUCKET_NAME || 'cork-service-status';
const gcFolderName = process.env.GC_FOLDER_NAME || 'uptime-events';


http('gcWebhookCorkStatus', async (req, res) => {
  if ( process.env.DISABLE_AUTH !== 'true' && req.query.secret !== process.env.WEBHOOK_KEY ) {
    res.status(401).send('Unauthorized');
    return;
  }

  // for local development, can load previously stored events from the bucket
  if ( req.query.action === 'loadEvents' && process.env.ENABLE_LOAD_EVENTS === 'true' ) {
    const events = await loadEventsFromBucket();
    res.send(`Loaded ${events.length} events from bucket.`);
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

    res.send(`Hook still in development. Payload received.`);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
    return;
  }
});

/**
 * @description Loads uptime events from a Google Cloud Storage bucket.
 * @returns {Promise<Array>} An array of events loaded from the Google Cloud Storage bucket.
 */
async function loadEventsFromBucket(){
  let events = [];
  try {
    const [files] = await storage.bucket(gcBucketName).getFiles({ prefix: `${gcFolderName}/` });
    files.sort((a, b) => new Date(a.metadata.timeCreated) - new Date(b.metadata.timeCreated));
    for (const file of files) {
      if (file.name === `${gcFolderName}/`) {
        // Skip the folder itself
        continue;
      }
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
