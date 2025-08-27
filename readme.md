#  Cork Service Status (WIP)
Status page for UC Davis Library apps and services.

![moss](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExYjNtMG1iY3BiMHZibXpmcDd6ZzM5ZnRiOTR5emYxMnZlem5mOHF3ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zyclIRxMwlY40/giphy.gif)
## Status Workflow
In progress

## Local Dev
- build images with `./deploy/cmds/build-local-dev.sh main`
- start cluster with `cd ./deploy/compose/cork-service-status-local-dev` and `docker compose up -d`
- start app with `./deploy/cmds/start-app.sh`
- start watch process with `./deploy/cmds/watch-client.sh`
  
### Status Fake Data Seeding

To insert fake services into the local-dev app, ensure the app is running, and run `./deploy/cmds/seed-services.sh <number-of-services>`

### Webhook
The uptime webhook service runs as a Google Cloud (GC) function, and when added as a notification channel to a GC uptime check alert policy, it will write the event to the database via postgrest.

During local development, you can load demo uptime events for some of our applications from a Google Cloud bucket:
- Download a service account key for accessing the bucket with `./deploy/cmds/get-webhook-bucket-key.sh`
- Restart the docker compose cluster if it is already running
- Ping the local webhook url
  - http://localhost:8081/?action=loadEvents will load the events as they are. If you don't have a service registered with the event's url, it will be skipped.
  - http://localhost:8081/?action=loadRandomEvents will assign each event to a random service that already exists in your database.
