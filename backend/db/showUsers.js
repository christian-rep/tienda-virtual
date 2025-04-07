const mysql = require('mysql2/promise');
require('dotenv').config();

async function showUsersTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'alkFCx1OXCAjlK4j87Vy',
    database: process.env.DB_NAME || 'tienda_virtual'
  });

  try {
    // Mostrar estructura de la tabla
    console.log('Estructura de la tabla usuarios:');
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM usuarios"
    );
    
    columns.forEach(column => {
      console.log(`- ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    // Mostrar usuarios existentes
    console.log('\nUsuarios existentes:');
    const [users] = await connection.query(
      "SELECT id, nombre, apellido, email, rol FROM usuarios"
    );
    
    if (users.length === 0) {
      console.log('No hay usuarios registrados');
    } else {
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Nombre: ${user.nombre} ${user.apellido || ''}, Email: ${user.email}, Rol: ${user.rol}`);
      });
    }
  } catch (error) {
    console.error('Error al mostrar la tabla usuarios:', error);
  } finally {
    await connection.end();
  }
}

// Ejecutar la función
showUsersTable(); 