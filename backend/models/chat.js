// routes/chat.js
const express = require('express');
const router = express.Router();
const { connectToDatabase } = require('../lib/mongoClient'); // Importa tu módulo

router.post('/chat', async (req, res) => {
  let client; // Declarar client para poder cerrarlo en caso de error

  try {
    // Usa la conexión en cada endpoint que necesites MongoDB
    const { db } = await connectToDatabase();
    
    // Ahora puedes usar la base de datos (db)
    const collection = db.collection('product_embeddings');
    const resultados = await collection.find({}).toArray(); // Ejemplo de consulta

    res.json(resultados);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
