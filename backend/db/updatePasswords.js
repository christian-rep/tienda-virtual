const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'alkFCx1OXCAjlK4j87Vy',
  database: process.env.DB_NAME || 'tienda_virtual',
  port: process.env.DB_PORT || 3306
};

// Función para generar una contraseña aleatoria de 6 a 10 caracteres
function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // Generar longitud aleatoria entre 6 y 10
  const length = Math.floor(Math.random() * (10 - 6 + 1)) + 6;
  let password = '';
  
  // Asegurar al menos una mayúscula, una minúscula y un número
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Una mayúscula
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Una minúscula
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Un número
  
  // Completar el resto de la contraseña
  for (let i = 3; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Mezclar los caracteres de la contraseña
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function updatePasswords() {
  let connection;
  
  try {
    // Establecer conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');
    
    // Obtener usuarios
    const [users] = await connection.query(
      'SELECT id, nombre, apellido, email, rol FROM usuarios'
    );
    
    console.log('\nActualizando contraseñas...');
    console.log('-------------------');
    
    // Actualizar contraseña para cada usuario
    for (const user of users) {
      // Generar nueva contraseña
      const newPassword = generatePassword();
      
      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Actualizar en la base de datos
      await connection.query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      // Mostrar credenciales
      console.log(`Usuario: ${user.nombre} ${user.apellido || ''}`);
      console.log(`Email: ${user.email}`);
      console.log(`Rol: ${user.rol}`);
      console.log(`Nueva contraseña: ${newPassword}`);
      console.log('-------------------');
    }
    
    console.log('✅ Contraseñas actualizadas correctamente');
    
  } catch (error) {
    console.error('❌ Error al actualizar contraseñas:', error);
  } finally {
    // Cerrar la conexión
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar la función
updatePasswords(); 