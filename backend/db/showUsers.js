const mysql = require('mysql2/promise');

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'alkFCx1OXCAjlK4j87Vy',
  database: process.env.DB_NAME || 'tienda_virtual',
  port: process.env.DB_PORT || 3306
};

async function showUsers() {
  let connection;
  
  try {
    // Establecer conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');
    
    // Primero, verificar qué columnas existen en la tabla
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM usuarios"
    );
    
    console.log('Columnas disponibles en la tabla usuarios:');
    columns.forEach(column => {
      console.log(`- ${column.Field}`);
    });
    
    // Construir la consulta dinámicamente basada en las columnas existentes
    const columnNames = columns.map(column => column.Field);
    const selectColumns = columnNames.join(', ');
    
    // Obtener usuarios
    const [users] = await connection.query(
      `SELECT ${selectColumns} FROM usuarios`
    );
    
    console.log('\nUsuarios registrados:');
    console.log('-------------------');
    
    if (users.length === 0) {
      console.log('No hay usuarios registrados');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Nombre: ${user.nombre}`);
        if (user.apellido) console.log(`Apellido: ${user.apellido}`);
        console.log(`Email: ${user.email}`);
        if (user.rol) console.log(`Rol: ${user.rol}`);
        if (user.password) console.log(`Password: [ENCRIPTADO]`);
        console.log('-------------------');
      });
    }
    
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
  } finally {
    // Cerrar la conexión
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar la función
showUsers(); 