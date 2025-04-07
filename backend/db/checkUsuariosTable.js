const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'alkFCx1OXCAjlK4j87Vy',
  database: process.env.DB_NAME || 'tienda_virtual',
  port: process.env.DB_PORT || 3306
};

async function checkAndCreateTable() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Verificar si la tabla existe
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'usuarios'"
    );

    if (tables.length === 0) {
      console.log('La tabla usuarios no existe. Creándola...');
      
      // Leer el archivo SQL
      const sqlFilePath = path.join(__dirname, 'usuarios.sql');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Ejecutar el script SQL
      await connection.query(sqlContent);
      console.log('Tabla usuarios creada correctamente');
    } else {
      console.log('La tabla usuarios ya existe');
    }
  } catch (error) {
    console.error('Error al verificar/crear la tabla usuarios:', error);
  } finally {
    await connection.end();
  }
}

// Ejecutar la función
checkAndCreateTable(); 