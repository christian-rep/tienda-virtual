const mysql = require('mysql2/promise');

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'alkFCx1OXCAjlK4j87Vy',
  database: process.env.DB_NAME || 'tienda_virtual',
  port: process.env.DB_PORT || 3306
};

async function checkUsuariosTable() {
  let connection;
  
  try {
    // Establecer conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');
    
    // Verificar si la tabla existe
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'usuarios'"
    );
    
    if (tables.length === 0) {
      console.log('❌ La tabla usuarios no existe');
      return;
    }
    
    console.log('✅ La tabla usuarios existe');
    
    // Obtener la estructura de la tabla
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM usuarios"
    );
    
    console.log('Estructura de la tabla usuarios:');
    columns.forEach(column => {
      console.log(`- ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    // Contar usuarios
    const [countResult] = await connection.query(
      "SELECT COUNT(*) as count FROM usuarios"
    );
    
    console.log(`Total de usuarios: ${countResult[0].count}`);
    
  } catch (error) {
    console.error('❌ Error al verificar la tabla de usuarios:', error);
  } finally {
    // Cerrar la conexión
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar la función
checkUsuariosTable(); 