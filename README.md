# Pokemon battle simulator

## Project setup

```bash
$ npm install
```

## MongoDB

The application connects to MongoDB through Mongoose. Local runs use `mongodb://localhost:27017/pokemon-game` by
default, which connects through the port published by Docker Compose. The Docker Compose API container uses
`.env.production`, where `MONGODB_URI` points to the `mongo` service name for container-to-container traffic.

Seed the Pokemon dataset into MongoDB after the database is running:

```bash
$ npm run db:seed
```

The seed stores one normalized document per Pokemon in the `pokemon` collection, including numeric height and weight
fields, lookup-friendly name and Pokedex fields, type/weakness arrays, evolution links, and multiplier values for battle
simulation logic.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

