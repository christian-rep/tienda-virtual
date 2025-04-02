require('./config/mongo');
require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Para recibir JSON en las peticiones
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);


// Rutas (se agregarán más adelante)
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/chat', require('./routes/chat'));
app.get('/', (req, res) => {
  res.send('Bienvenido a la API de la tienda virtual');
});


// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

