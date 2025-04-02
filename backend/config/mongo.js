const mongoose = require('mongoose');
require('dotenv').config(); // Cargar variables de entorno desde .env

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('ERROR: La URI de MongoDB no está definida en las variables de entorno.');
    process.exit(1); // Detener la ejecución si la conexión no está configurada
}

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Conectado a MongoDB');
    })
    .catch(error => {
        console.error('Error de conexión a MongoDB:', error);
        process.exit(1);
    });

