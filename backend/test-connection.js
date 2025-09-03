// test-connection.js
require('dotenv').config(); // Carga las variables de entorno
const { connectToDatabase } = require('./lib/mongoClient');

async function test() {
  try {
    console.log("🔄 Intentando conectar a MongoDB Atlas...");
    const { db } = await connectToDatabase();
    console.log('✅ Conexión exitosa a la BD:', db.databaseName);

    // Opcional: Haz una consulta simple para confirmar que todo funciona
    const collections = await db.listCollections().toArray();
    console.log("📂 Colecciones en la base de datos:", collections.map(c => c.name));

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    // Es importante cerrar la conexión para que el script termine
    process.exit(0); // Finaliza el proceso de Node.js
  }
}

// Ejecuta la función de prueba
test();