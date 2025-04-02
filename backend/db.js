const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "localhost",
    user: "root", // Asegúrate de que este usuario tenga acceso a la BD
    password: "alkFCx1OXCAjlK4j87Vy", // Revisa que la contraseña sea correcta
    database: "tienda_virtual",
    port: 5000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection()
    .then(() => console.log("✅ Conectado a MySQL"))
    .catch((error) => console.error("❌ Error al conectar a MySQL:", error.message));

module.exports = pool;
