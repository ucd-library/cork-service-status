  import { http } from '@google-cloud/functions-framework';

  http('gcWebhookCorkStatus', async (req, res) => {
    // Your code here

    // Send an HTTP response
    res.send(`Steve is great: ${process.env.WEBHOOK_KEY}`);
  });
