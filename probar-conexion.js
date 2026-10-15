const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    await client.db('recuerdame').command({ ping: 1 });
    console.log('Conexión exitosa a MongoDB');
  } catch (err) {
    console.error('Error de conexión:', err.message);
  } finally {
    await client.close();
  }
}

main();