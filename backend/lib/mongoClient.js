// lib/mongoClient.js
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI; // Lee la URI desde .env

if (!uri) {
  throw new Error('La variable de entorno MONGODB_URI no está definida.');
}

// Crea una instancia del cliente con la API estable
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Variable para cachear la conexión
let cachedClient = null;
let cachedDb = null;

// Función para conectar y obtener la base de datos
async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    await client.connect();
    
    // Elige el nombre de tu base de datos (puede ser "tienda-chatbot")
    const db = client.db('tienda-chatbot'); 
    
    // Cachea la conexión para reutilizarla
    cachedClient = client;
    cachedDb = db;

    console.log('✅ Conectado a MongoDB Atlas');
    return { client, db };

  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    await client.close();
    throw error;
  }
}

// No cerramos la conexión automáticamente. La reutilizamos.
module.exports = { connectToDatabase };