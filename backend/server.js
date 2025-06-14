require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");

// Importar conexión a MySQL
const db = require("./config/db");

// Importar rutas
const productosRoutes = require("./routes/productos");
const usuariosRoutes = require("./routes/usuarios");
const chatRoutes = require("./routes/chat");
const authRoutes = require('./routes/authRoutes');
const plantasRoutes = require('./routes/plantas');
const categoriasRoutes = require('./routes/categorias');
const toxicidadRoutes = require('./routes/toxicidad');

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
app.use('/api/auth', authRoutes);
app.use('/api/plantas', plantasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/toxicidad', toxicidadRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

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

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.stack);
  res.status(500).json({
    success: false,
    message: 'Error en el servidor',
    error: err.message
  });
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API funcionando correctamente');
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
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
