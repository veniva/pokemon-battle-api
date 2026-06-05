This repository and its contents may not be used for training, fine-tuning, or improving machine learning or AI models without explicit permission.

# Pokemon battle simulator API
This API simulates deterministic battles between two teams of Pokemon loaded from MongoDB. Teams fight in the order
provided in the request: the first Pokemon from each team battle first, the round loser is removed, and the winner stays
in for the next round with fatigue applied. Rounds continue until one team has no Pokemon left, and the API returns a
structured response with scores, round details, and a readable battle log.

# How to install
Install Docker, then start the API and MongoDB with Docker Compose:

```bash
$ npm run docker:up
```

The first run builds the Node API image and downloads the MongoDB image, so expect Docker to store a few hundred MB or
more on your machine. After the containers start, the API is available at `http://localhost:3000`.

Seed the Pokemon dataset into the MongoDB container:

```bash
$ npm run db:seed
```

Stop the containers when you are done:

```bash
$ npm run docker:down
```

# How to play
Start the API and send a `POST` request to `/pokemon/battles/simulate` with two teams. Each team can contain 1 to 6
Pokemon identifiers, using names, numeric ids, or Pokedex numbers.

Example using Pokemon names:

```http
POST /pokemon/battles/simulate
Content-Type: application/json
```

```json
{
  "teamA": {
    "name": "Garden Squad",
    "pokemon": ["Bulbasaur", "Ivysaur", "Venusaur"]
  },
  "teamB": {
    "name": "Flame Squad",
    "pokemon": ["Charmander", "Charmeleon", "Charizard"]
  }
}
```

Example using Pokedex numbers:

```json
{
  "teamA": {
    "name": "Electric Duo",
    "pokemon": ["025", "026"]
  },
  "teamB": {
    "name": "Ground Line",
    "pokemon": ["027", "028"]
  }
}
```

Example using mixed identifiers:

```json
{
  "teamA": {
    "name": "Balanced Picks",
    "pokemon": ["Squirtle", "008", "Blastoise", "25"]
  },
  "teamB": {
    "name": "Forest Picks",
    "pokemon": ["10", "Butterfree", "Pidgeotto", "018"]
  }
}
```

Example where a larger but weaker team loses:

```json
{
  "teamA": {
    "name": "Many Weak Picks",
    "pokemon": ["Caterpie", "Weedle", "Pidgey", "Rattata", "Zubat"]
  },
  "teamB": {
    "name": "Single Heavy Hitter",
    "pokemon": ["Dragonite"]
  }
}
```

In this matchup, `Single Heavy Hitter` is expected to win because Dragonite's round scores are strong enough to knock out
each opponent before fatigue makes it lose.


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

