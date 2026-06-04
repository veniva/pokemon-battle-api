db = db.getSiblingDB('pokemon-game');

db.createCollection('pokemon');
db.createCollection('battle_logs');