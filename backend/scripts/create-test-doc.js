// scripts/create-test-doc.js
require('dotenv').config();
const { connectToDatabase } = require('../lib/mongoClient'); // Ajusta la ruta

async function createTestDoc() {
  const { db } = await connectToDatabase();
  const collection = db.collection('test_collection'); // Se creará sola

  const testDoc = { message: "Hola MongoDB!", date: new Date() };
  const result = await collection.insertOne(testDoc);

  console.log('✅ Documento insertado con ID:', result.insertedId);
  process.exit(0);
}

createTestDoc().catch(console.error);