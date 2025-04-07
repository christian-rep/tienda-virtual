const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'alkFCx1OXCAjlK4j87Vy',
  database: process.env.DB_NAME || 'tienda_virtual',
  port: process.env.DB_PORT || 3306
};

async function updateUsuariosTable() {
  let connection;
  
  try {
    // Establecer conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');
    
    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'add_password_column.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Ejecutar el SQL
    await connection.query(sql);
    console.log('✅ Tabla de usuarios actualizada correctamente');
    
  } catch (error) {
    console.error('❌ Error al actualizar la tabla de usuarios:', error);
  } finally {
    // Cerrar la conexión
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar la función
updateUsuariosTable(); 