const db = require('../config/db');

// Obtener todos los niveles de toxicidad
const getToxicidadLevels = async (req, res, next) => {
    try {
        // Solo seleccionamos id y nivel, sin la descripción
        const [toxicidades] = await db.query('SELECT id, nivel FROM toxicidad ORDER BY id');
        res.json(toxicidades);
    } catch (error) {
        console.error('Error al obtener niveles de toxicidad:', error);
        next(error);
    }
};

module.exports = {
    getToxicidadLevels
}; 