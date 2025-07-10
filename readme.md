#  Cork Service Status (WIP)
Status page for UC Davis Library apps and services.

![moss](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExYjNtMG1iY3BiMHZibXpmcDd6ZzM5ZnRiOTR5emYxMnZlem5mOHF3ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zyclIRxMwlY40/giphy.gif)
## Status Workflow
In progress
## Status Fake Data Seeding

### Deploy Data Seeding
1. Run `./cmds/build-local-dev` to build Dockerfile 
2. Go to `/deploy/compose/cork-service-status-local-dev` folder
3. You can start up the docker compose app container to run detatched: `docker compose up -d`

#### Inside Container
In the `/deploy/compose/cork-service-status-local-dev` folder
1. Bash into container to use cli: `docker compose exec -it app bash` 
2. Run command `node data-seeder/seed.js --services <amount of services>`

#### Outside Container
In the `/deploy/compose/cork-service-status-local-dev` folder run `docker compose exec app node data-seeder/seed.js --services <amount of services>`