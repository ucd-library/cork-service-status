#  Cork Service Status (WIP)
Status page for UC Davis Library apps and services.

![moss](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExYjNtMG1iY3BiMHZibXpmcDd6ZzM5ZnRiOTR5emYxMnZlem5mOHF3ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zyclIRxMwlY40/giphy.gif)
## Status Workflow
In progress

## Local Dev
- build images with `./deploy/cmds/build-local-dev.sh main`
- start stack with `./deploy/cmds/start-app.sh`
- start watch process with `./deploy/cmds/watch-client.sh`
  
### Status Fake Data Seeding

To insert fake services into the local-dev app, ensure the app is running, and run `./deploy/cmds/seed-services.sh <number-of-services>`
