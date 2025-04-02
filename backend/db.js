const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Cambia por tu usuario
    password: 'alkFCx1OXCAjlK4j87Vy', // Pon la contraseña entre comillas
    database: 'tienda_virtual',
    port: 5000
});

connection.connect(err => {
    if (err) {
        console.error('Error de conexión a MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');
});

module.exports = connection;

