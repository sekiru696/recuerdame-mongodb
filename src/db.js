const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function conectar() {
  if (!db) {
    await client.connect();
    db = client.db('recuerdame');
  }
  return db;
}

async function cerrar() {
  await client.close();
}

module.exports = { conectar, cerrar };