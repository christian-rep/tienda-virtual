const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Configuración de multer para el almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Crear el directorio base si no existe
        const baseDir = path.join(__dirname, '../../frontend/src/assets/images/plantas');
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
        
        // Para nuevas plantas, usamos un directorio temporal
        const plantaId = req.params.id || 'temp';
        const uploadPath = path.join(baseDir, plantaId);
        
        // Crear el directorio específico si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generar un nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configuración de multer
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Aceptar solo imágenes
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Solo se permiten archivos de imagen'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // límite de 5MB
    }
}).array('imagenes', 5); // Permitir hasta 5 imágenes

// Función para manejar la subida de imágenes
const handleImageUpload = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Error de Multer:', err);
            return res.status(400).json({ 
                error: 'Error al subir las imágenes',
                details: err.message 
            });
        } else if (err) {
            console.error('Error general:', err);
            return res.status(400).json({ 
                error: 'Error al procesar las imágenes',
                details: err.message 
            });
        }
        next();
    });
};

// Middleware para verificar que el usuario es admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
    }
};

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

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
            toxicidades = []
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
        if (toxicidades && toxicidades.length > 0) {
            try {
                console.log('Toxicidades recibidas:', JSON.stringify(toxicidades, null, 2));
                
                const toxicidadesValues = toxicidades.map(t => {
                    // Asegurarnos de que t sea un objeto y tenga las propiedades necesarias
                    const toxicidad = typeof t === 'string' ? JSON.parse(t) : t;
                    console.log('Procesando toxicidad:', toxicidad);
                    
                    if (!toxicidad.id) {
                        console.error('Toxicidad sin ID:', toxicidad);
                        throw new Error('ID de toxicidad no proporcionado');
                    }
                    
                    // Validar que el ID sea un número o string válido
                    if (isNaN(toxicidad.id) && typeof toxicidad.id !== 'string') {
                        console.error('ID de toxicidad inválido:', toxicidad.id);
                        throw new Error('ID de toxicidad inválido');
                    }
                    
                    return [plantaId, toxicidad.id, toxicidad.detalles || ''];
                });
                
                console.log('Valores de toxicidades a insertar:', toxicidadesValues);
                
                if (toxicidadesValues.length === 0) {
                    console.log('No hay toxicidades válidas para insertar');
                    return;
                }
                
                await db.query(
                    'INSERT INTO planta_toxicidad (planta_id, toxicidad_id, detalles) VALUES ?',
                    [toxicidadesValues]
                );
                
                console.log('Toxicidades insertadas correctamente');
            } catch (error) {
                console.error('Error detallado al procesar toxicidades:', error);
                // Si hay error en las toxicidades, eliminamos la planta creada
                await db.query('DELETE FROM plantas WHERE id = ?', [plantaId]);
                return res.status(400).json({ 
                    error: 'Error al procesar las toxicidades',
                    details: error.message,
                    toxicidades_recibidas: toxicidades
                });
            }
        } else {
            console.log('No se recibieron toxicidades para procesar');
        }
        
        // Procesar imágenes subidas
        if (req.files && req.files.length > 0) {
            const imagenesValues = req.files.map((file, index) => [
                plantaId,
                file.filename,
                index,
                index === 0 ? 1 : 0 // La primera imagen es la principal
            ]);
            
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
        console.log('Iniciando actualización de planta:', { id });
        console.log('Body recibido:', req.body);
        console.log('Archivos recibidos:', req.files);

        // Parsear categorías y toxicidades si vienen como strings
        let categorias = [];
        let toxicidades = [];
        
        try {
            if (typeof req.body.categorias === 'string') {
                categorias = JSON.parse(req.body.categorias);
            } else if (Array.isArray(req.body.categorias)) {
                categorias = req.body.categorias;
            }

            if (typeof req.body.toxicidades === 'string') {
                toxicidades = JSON.parse(req.body.toxicidades);
            } else if (Array.isArray(req.body.toxicidades)) {
                toxicidades = req.body.toxicidades;
            }
        } catch (parseError) {
            console.error('Error al parsear categorías o toxicidades:', parseError);
            return res.status(400).json({ 
                error: 'Error en el formato de categorías o toxicidades',
                details: parseError.message 
            });
        }

        // Extraer datos básicos
        const {
            nombre, 
            nombre_cientifico, 
            descripcion, 
            precio, 
            nivel_dificultad, 
            stock
        } = req.body;

        // Validar datos requeridos
        if (!nombre || !descripcion || !precio || !nivel_dificultad) {
            return res.status(400).json({ 
                error: 'Faltan campos obligatorios',
                required: ['nombre', 'descripcion', 'precio', 'nivel_dificultad']
            });
        }

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
            [nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock || 0, id]
        );

        // Actualizar categorías
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
            try {
                const toxicidadesValues = toxicidades.map(t => {
                    // Asegurarnos de que t sea un objeto y tenga las propiedades necesarias
                    const toxicidad = typeof t === 'string' ? JSON.parse(t) : t;
                    if (!toxicidad.id) {
                        throw new Error('ID de toxicidad no proporcionado');
                    }
                    return [id, toxicidad.id, toxicidad.detalles || ''];
                });
                
                console.log('Insertando toxicidades:', toxicidadesValues);
                
                await db.query(
                    'INSERT INTO planta_toxicidad (planta_id, toxicidad_id, detalles) VALUES ?',
                    [toxicidadesValues]
                );
            } catch (error) {
                console.error('Error al procesar toxicidades:', error);
                return res.status(400).json({ 
                    error: 'Error al procesar las toxicidades',
                    details: error.message 
                });
            }
        }

        // Procesar nuevas imágenes si se subieron
        if (req.files && req.files.length > 0) {
            try {
                // Obtener el orden actual más alto
                const [maxOrder] = await db.query(
                    'SELECT MAX(orden) as maxOrden FROM imagenes_plantas WHERE planta_id = ?',
                    [id]
                );
                const startOrder = (maxOrder[0]?.maxOrden || 0) + 1;

                const imagenesValues = req.files.map((file, index) => [
                    id,
                    file.filename,
                    startOrder + index,
                    startOrder === 1 ? 1 : 0 // La primera imagen es principal solo si es la primera
                ]);

                await db.query(
                    `INSERT INTO imagenes_plantas 
                     (planta_id, url, orden, es_principal) VALUES ?`,
                    [imagenesValues]
                );
            } catch (error) {
                console.error('Error al procesar imágenes:', error);
                // No lanzamos el error para permitir que la actualización continúe
            }
        }

        res.json({
            id,
            message: 'Planta actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error en updatePlanta:', error);
        res.status(500).json({ 
            error: 'Error al actualizar la planta',
            details: error.message
        });
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
    verifyEmail,
    handleImageUpload,
    isAdmin,
    verifyToken
};