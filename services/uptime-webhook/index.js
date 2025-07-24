  import { http } from '@google-cloud/functions-framework';

  http('gcWebhookCorkStatus', async (req, res) => {
    if ( process.env.DISABLE_AUTH !== 'true' && req.query.secret !== process.env.WEBHOOK_KEY ) {
      res.status(401).send('Unauthorized');
      return;
    }

    res.send(`Steve is great!! foo: ${process.env.WEBHOOK_KEY}`);
  });
