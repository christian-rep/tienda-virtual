const db = require('../config/db');

// Obtener todas las categorías
const getCategorias = async (req, res, next) => {
    try {
        console.log('Iniciando consulta de categorías...');
        
        const [categorias] = await db.query(`
            SELECT c.id, c.nombre
            FROM categorias c
            WHERE c.activo = 1
            AND c.es_principal = 1
            ORDER BY c.nombre ASC
        `);
        
        console.log(`Se encontraron ${categorias.length} categorías`);
        res.json(categorias);
    } catch (error) {
        console.error('Error detallado en getCategorias:', error);
        res.status(500).json({ 
            error: 'Error al obtener las categorías',
            message: error.message,
            stack: error.stack
        });
    }
};

module.exports = {
    getCategorias
}; 