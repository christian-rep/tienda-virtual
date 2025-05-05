const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Obtener todas las plantas con sus relaciones
const getPlantas = async (req, res, next) => {
    try {
        console.log('Iniciando consulta de plantas...');
        
        // Consulta principal para obtener plantas
        const [plantas] = await db.query(`
            SELECT p.*
            FROM plantas p
        `);
        
        console.log(`Se encontraron ${plantas.length} plantas`);
        res.json(plantas);
    } catch (error) {
        console.error('Error detallado en getPlantas:', error);
        res.status(500).json({ 
            error: 'Error al obtener las plantas',
            message: error.message,
            stack: error.stack
        });
    }
};

// Obtener una planta por ID con todas sus relaciones
const getPlantaById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Consulta principal
        const [plantas] = await db.query(`
            SELECT p.*, 
                   GROUP_CONCAT(DISTINCT pc.id_categoria) AS categorias,
                   GROUP_CONCAT(DISTINCT pt.toxicidad_id) AS toxicidades
            FROM plantas p
            LEFT JOIN plantas_categorias pc ON p.id = pc.planta_id
            LEFT JOIN planta_toxicidad pt ON p.id = pt.planta_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [id]);
        
        if (plantas.length === 0) {
            return res.status(404).json({ error: 'Planta no encontrada' });
        }
        
        const planta = plantas[0];
        
        // Obtener todas las imágenes
        const [imagenes] = await db.query(
            'SELECT * FROM imagenes_plantas WHERE planta_id = ? ORDER BY es_principal DESC, orden',
            [id]
        );
        
        // Obtener detalles de toxicidad
        const [toxicidades] = await db.query(`
            SELECT t.nivel, t.descripcion, pt.detalles 
            FROM toxicidad t
            JOIN planta_toxicidad pt ON t.id = pt.toxicidad_id
            WHERE pt.planta_id = ?
        `, [id]);
        
        // Obtener categorías con nombres
        const [categorias] = await db.query(`
            SELECT c.id, c.nombre 
            FROM categorias c
            JOIN plantas_categorias pc ON c.id = pc.id_categoria
            WHERE pc.planta_id = ?
        `, [id]);
        
        // Estructurar los datos de respuesta
        planta.imagenes = imagenes;
        planta.toxicidades = toxicidades;
        planta.categorias = categorias;
        
        res.json(planta);
    } catch (error) {
        next(error);
    }
};

// Crear una nueva planta con sus relaciones
const createPlanta = async (req, res, next) => {
    try {
        const {
            nombre, 
            nombre_cientifico, 
            descripcion, 
            precio, 
            nivel_dificultad, 
            stock,
            categorias = [],
            toxicidades = [],
            imagenes = []
        } = req.body;
        
        // Validaciones básicas
        if (!nombre || !descripcion || !precio || !nivel_dificultad) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        
        // Crear la planta principal
        const plantaId = uuidv4();
        await db.query(
            `INSERT INTO plantas 
             (id, nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [plantaId, nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock || 0]
        );
        
        // Procesar categorías
        if (categorias.length > 0) {
            const categoriasValues = categorias.map(catId => [plantaId, catId]);
            await db.query(
                'INSERT INTO plantas_categorias (planta_id, id_categoria) VALUES ?',
                [categoriasValues]
            );
        }
        
        // Procesar toxicidades
        if (toxicidades.length > 0) {
            const toxicidadesValues = toxicidades.map(t => [plantaId, t.id, t.detalles]);
            await db.query(
                'INSERT INTO planta_toxicidad (planta_id, toxicidad_id, detalles) VALUES ?',
                [toxicidadesValues]
            );
        }
        
        // Procesar imágenes
        if (imagenes.length > 0) {
            const imagenesValues = imagenes.map((img, index) => 
                [plantaId, img.url, index, img.es_principal || 0]
            );
            await db.query(
                `INSERT INTO imagenes_plantas 
                 (planta_id, url, orden, es_principal) VALUES ?`,
                [imagenesValues]
            );
        }
        
        res.status(201).json({
            id: plantaId,
            nombre,
            message: 'Planta creada exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar una planta y sus relaciones
const updatePlanta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            nombre, 
            nombre_cientifico, 
            descripcion, 
            precio, 
            nivel_dificultad, 
            stock,
            categorias = [],
            toxicidades = [],
            imagenes = []
        } = req.body;
        
        // Verificar si la planta existe
        const [plantas] = await db.query('SELECT * FROM plantas WHERE id = ?', [id]);
        if (plantas.length === 0) {
            return res.status(404).json({ error: 'Planta no encontrada' });
        }
        
        // Actualizar datos básicos de la planta
        await db.query(
            `UPDATE plantas SET
                nombre = ?,
                nombre_cientifico = ?,
                descripcion = ?,
                precio = ?,
                nivel_dificultad = ?,
                stock = ?
            WHERE id = ?`,
            [nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock, id]
        );
        
        // Actualizar categorías (eliminar todas y volver a insertar)
        await db.query('DELETE FROM plantas_categorias WHERE planta_id = ?', [id]);
        if (categorias.length > 0) {
            const categoriasValues = categorias.map(catId => [id, catId]);
            await db.query(
                'INSERT INTO plantas_categorias (planta_id, id_categoria) VALUES ?',
                [categoriasValues]
            );
        }
        
        // Actualizar toxicidades
        await db.query('DELETE FROM planta_toxicidad WHERE planta_id = ?', [id]);
        if (toxicidades.length > 0) {
            const toxicidadesValues = toxicidades.map(t => [id, t.id, t.detalles]);
            await db.query(
                'INSERT INTO planta_toxicidad (planta_id, toxicidad_id, detalles) VALUES ?',
                [toxicidadesValues]
            );
        }
        
        // Actualizar imágenes (opcional, dependiendo de tu lógica)
        // Podrías decidir no permitir actualización de imágenes o manejarlo aparte
        
        res.json({
            id,
            message: 'Planta actualizada exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar una planta (borrado lógico)
const deletePlanta = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Verificar si la planta existe
        const [plantas] = await db.query('SELECT * FROM plantas WHERE id = ?', [id]);
        if (plantas.length === 0) {
            return res.status(404).json({ error: 'Planta no encontrada' });
        }
        
        // Borrado lógico en lugar de físico
        await db.query('UPDATE plantas SET activo = 0 WHERE id = ?', [id]);
        
        res.json({
            message: 'Planta desactivada exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// Buscar plantas por término
const searchPlantas = async (req, res, next) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
        }
        
        const searchTerm = `%${q}%`;
        
        const [plantas] = await db.query(
            `SELECT p.*, 
                    (SELECT url FROM imagenes_plantas WHERE planta_id = p.id AND es_principal = 1 LIMIT 1) AS imagen_principal
             FROM plantas p
             WHERE p.activo = 1
             AND (p.nombre LIKE ? OR p.nombre_cientifico LIKE ? OR p.descripcion LIKE ?)`,
            [searchTerm, searchTerm, searchTerm]
        );
        
        res.json(plantas);
    } catch (error) {
        next(error);
    }
};

// Filtrar plantas por categoría
const filterPlantas = async (req, res, next) => {
    try {
        const { categoria, dificultad, precio_min, precio_max } = req.query;
        
        let query = `
            SELECT DISTINCT p.*, 
                   (SELECT url FROM imagenes_plantas WHERE planta_id = p.id AND es_principal = 1 LIMIT 1) AS imagen_principal,
                   GROUP_CONCAT(DISTINCT c.nombre) AS nombres_categorias
            FROM plantas p
            LEFT JOIN plantas_categorias pc ON p.id = pc.planta_id
            LEFT JOIN categorias c ON pc.id_categoria = c.id
            WHERE p.activo = 1
        `;
        
        const params = [];
        
        if (categoria) {
            query += ' AND pc.id_categoria = ?';
            params.push(categoria);
        }
        
        if (dificultad) {
            // Asegurarnos de que el valor de dificultad coincida con el ENUM
            const dificultadValida = ['facil', 'medio', 'dificil'].includes(dificultad.toLowerCase());
            if (dificultadValida) {
                query += ' AND LOWER(p.nivel_dificultad) = LOWER(?)';
                params.push(dificultad);
            }
        }

        if (precio_min) {
            query += ' AND p.precio >= ?';
            params.push(precio_min);
        }

        if (precio_max) {
            query += ' AND p.precio <= ?';
            params.push(precio_max);
        }

        query += ' GROUP BY p.id ORDER BY p.nombre ASC';
        
        console.log('Query de filtrado:', query);
        console.log('Parámetros:', params);
        
        const [plantas] = await db.query(query, params);
        
        res.json(plantas);
    } catch (error) {
        console.error('Error en filterPlantas:', error);
        next(error);
    }
};

// Nuevo método para verificar el email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token de verificación no proporcionado'
            });
        }

        // Buscar usuario con el token de verificación
        const [users] = await db.query(
            'SELECT * FROM usuarios WHERE token_verificacion = ? AND fecha_expiracion_token > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        const user = users[0];

        // Actualizar el usuario como verificado y activo
        await db.query(
            'UPDATE usuarios SET email_verificado = 1, activo = 1, token_verificacion = NULL, fecha_expiracion_token = NULL WHERE id = ?',
            [user.id]
        );

        res.status(200).json({
            success: true,
            message: 'Email verificado correctamente. Tu cuenta ha sido activada. Por favor, inicia sesión.'
        });
    } catch (error) {
        console.error('Error en verificación de email:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

module.exports = {
    getPlantas,
    getPlantaById,
    createPlanta,
    updatePlanta,
    deletePlanta,
    searchPlantas,
    filterPlantas,
    verifyEmail
};