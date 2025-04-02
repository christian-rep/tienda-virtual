require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const mysql = require("mysql2/promise"); // 🔥 Usar modo promesas
const morgan = require("morgan");

// Importar rutas
const productosRoutes = require("./routes/productos");
const usuariosRoutes = require("./routes/usuarios");
const chatRoutes = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rutas
app.use("/api/productos", productosRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/chat", chatRoutes);

// Conexión a MongoDB
if (!process.env.MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI no está definida en el archivo .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err.message);
    process.exit(1);
  });

// Conexión a MySQL con promesas
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificar conexión a MySQL
(async () => {
  try {
    await db.getConnection();
    console.log("✅ Conectado a MySQL");
  } catch (err) {
    console.error("❌ Error conectando a MySQL:", err.message);
    process.exit(1);
  }
})();

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.stack);
  res.status(500).json({ error: "Ocurrió un error en el servidor" });
});

app.get("/", (req, res) => {
  res.send("Bienvenido a la API de la tienda virtual");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de errores globales
process.on("uncaughtException", (err) => {
  console.error("💥 Error no manejado:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Promesa rechazada sin manejar:", reason);
});

module.exports = { db }; // Exportar la conexión para usar en otros archivos
