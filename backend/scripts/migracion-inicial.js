// scripts/migracion-inicial.js
require('dotenv').config(); // Carga las variables de entorno (MONGODB_URI)
const mysql = require('mysql2/promise'); // Asegúrate de tener instalado mysql2
const { connectToDatabase } = require('../lib/mongoClient'); // Importa tu conexión
const { generarEmbedding } = require('../lib/embeddingUtils'); // Importar tu función de embeddings

// Configuración de conexión a MySQL (AJUSTA ESTOS VALORES)
const configMySQL = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'alkFCx1OXCAjlK4j87Vy',
  database: process.env.DB_NAME || 'tienda_bd'
};

async function main() {
  console.log('🚀 Iniciando migración de productos a MongoDB...\n');

  let connectionMySQL;
  let clientMongo;

  try {
    // 1. Conectarse a MySQL
    console.log('🔗 Conectando a MySQL...');
    connectionMySQL = await mysql.createConnection(configMySQL);

    // 2. Conectarse a MongoDB Atlas
    console.log('🔗 Conectando a MongoDB Atlas...');
    const { db: dbMongo, client } = await connectToDatabase();
    clientMongo = client;
    const collectionEmbeddings = dbMongo.collection('product_embeddings');

    // 3. Obtener TODOS los productos de MySQL
    console.log('📦 Obteniendo productos de MySQL...');
    const [plantas] = await connectionMySQL.execute(`
      SELECT id, nombre, nombre_cientifico, descripcion, precio, nivel_dificultad 
      FROM plantas 
      WHERE activo = 1
    `);
    console.log(`✅ Se encontraron ${plantas.length} productos para migrar.\n`);

    // 4. Migrar cada producto
    for (let i = 0; i < plantas.length; i++) {
      const planta = plantas[i];
      console.log(`🔄 [${i+1}/${plantas.length}] Procesando: ${planta.nombre} (ID: ${planta.id})`);

      // Crear el texto para el embedding (combina campos relevantes)
      const texto = [
        planta.nombre,
        planta.nombre_cientifico,
        planta.descripcion,
        `Nivel de dificultad: ${planta.nivel_dificultad}`
      ].filter(Boolean).join(' '); // Filtra campos vacíos y une

      // Generar el embedding (USA TU FUNCIÓN aquí)
      let embedding;
      try {
        // IMPORTANTE: Debes tener esta función implementada
        embedding = await generarEmbedding(texto);
      } catch (error) {
        console.error(`   ❌ Error generando embedding para "${planta.nombre}":`, error.message);
        continue; // Salta este producto y continúa con el siguiente
      }

      // Preparar el documento para MongoDB
      const documento = {
        producto_id: planta.id, // EL UUID de MySQL
        embedding: embedding,   // El vector de la planta
        metadata: {
          nombre: planta.nombre,
          nombre_cientifico: planta.nombre_cientifico,
          precio: planta.precio,
          nivel_dificultad: planta.nivel_dificultad
        }
      };

      // Insertar o actualizar en MongoDB
      await collectionEmbeddings.updateOne(
        { producto_id: planta.id }, // Filtro por ID
        { $set: documento },        // Datos a insertar/actualizar
        { upsert: true }            // Opción para crear si no existe
      );

      console.log(`   ✅ Migrado: ${planta.nombre}`);
    }

    console.log('\n🎉 ¡Migración completada con éxito!');
    console.log('📊 Puedes verificar los datos en MongoDB Atlas.');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
  } finally {
    // 5. Cerrar conexiones
    if (connectionMySQL) await connectionMySQL.end();
    if (clientMongo) await clientMongo.close();
    console.log('\n🔒 Conexiones cerradas.');
    process.exit(0); // Finalizar el proceso
  }
}

// Ejecutar la migración
main();