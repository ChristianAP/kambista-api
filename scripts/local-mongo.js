const fs = require('node:fs');
const path = require('node:path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = 27017;
const DATABASE_PATH = path.join(__dirname, '..', '.mongo-data');

async function start() {
  fs.mkdirSync(DATABASE_PATH, { recursive: true });

  const server = await MongoMemoryServer.create({
    instance: { port: PORT, dbPath: DATABASE_PATH, storageEngine: 'wiredTiger' },
  });

  console.log(`MongoDB local disponible en mongodb://127.0.0.1:${PORT}/kambista-fx`);
  console.log('Los datos se guardan en .mongo-data. Presiona Ctrl+C para detenerlo.');

  const stop = async () => {
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
