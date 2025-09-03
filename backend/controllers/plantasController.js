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
        
        // Crear el directorio default si no existe
        const defaultDir = path.join(baseDir, 'default');
        if (!fs.existsSync(defaultDir)) {
            fs.mkdirSync(defaultDir, { recursive: true });
        }
        
        // Obtener el ID de la planta
        const plantaId = req.params.id;
        if (!plantaId) {
            return cb(new Error('ID de planta no proporcionado'));
        }
        
        const uploadPath = path.join(baseDir, plantaId);
        
        // Crear el directorio específico si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        console.log('Directorio de destino:', uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Siempre usar principal.jpg como nombre
        cb(null, 'principal.jpg');
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
}).single('imagenes');

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
const getPlantas = async (req, res) => {
    try {
        const [plantas] = await db.query(`
            SELECT DISTINCT p.*, 
                   GROUP_CONCAT(DISTINCT c.nombre) AS nombres_categorias,
                   GROUP_CONCAT(DISTINCT t.nivel) AS niveles_toxicidad
            FROM plantas p
            LEFT JOIN plantas_categorias pc ON p.id = pc.planta_id
            LEFT JOIN categorias c ON pc.id_categoria = c.id
            LEFT JOIN planta_toxicidad pt ON p.id = pt.planta_id
            LEFT JOIN toxicidad t ON pt.toxicidad_id = t.id
            WHERE p.activo = 1
            GROUP BY p.id
            ORDER BY p.nombre ASC
        `);

        // Obtener las imágenes para cada planta
        for (let planta of plantas) {
            const [imagenes] = await db.query(
                'SELECT * FROM imagenes_plantas WHERE planta_id = ?',
                [planta.id]
            );
            planta.imagenes = imagenes;
            
            // Establecer la imagen principal
            const imagenPrincipal = imagenes.find(img => img.es_principal);
            planta.imagen_principal = imagenPrincipal ? imagenPrincipal.url : null;
        }

        console.log('Plantas encontradas:', plantas.length);
        res.json(plantas);
    } catch (error) {
        console.error('Error al obtener plantas:', error);
        res.status(500).json({ error: 'Error al obtener las plantas' });
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
        console.log('Body recibido:', req.body);
        
        const {
            nombre, 
            nombre_cientifico, 
            descripcion, 
            precio, 
            nivel_dificultad, 
            stock,
            categorias: categoriasRaw = '[]',
            toxicidades: toxicidadesRaw = '[]'
        } = req.body;
        
        // Validaciones básicas
        if (!nombre || !descripcion || !precio || !nivel_dificultad) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        
        // Procesar categorías
        let categorias = [];
        try {
            console.log('Categorías raw:', categoriasRaw);
            if (typeof categoriasRaw === 'string') {
                categorias = JSON.parse(categoriasRaw);
            } else if (Array.isArray(categoriasRaw)) {
                categorias = categoriasRaw;
            }
            if (!Array.isArray(categorias)) {
                throw new Error('Las categorías deben ser un array');
            }
            console.log('Categorías procesadas:', categorias);
        } catch (error) {
            console.error('Error al procesar categorías:', error);
            return res.status(400).json({ 
                error: 'Error al procesar las categorías',
                details: error.message,
                categorias_recibidas: categoriasRaw
            });
        }
        
        // Crear la planta principal
        const plantaId = uuidv4();
        
        // Crear el directorio para las imágenes
        const baseDir = path.join(__dirname, '../../frontend/src/assets/images/plantas');
        const plantaDir = path.join(baseDir, plantaId);
        if (!fs.existsSync(plantaDir)) {
            fs.mkdirSync(plantaDir, { recursive: true });
            console.log('Directorio creado:', plantaDir);
        }

        // Insertar la planta en la base de datos
        await db.query(
            `INSERT INTO plantas 
             (id, nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock, activo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [plantaId, nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock || 0]
        );
        
        // Procesar categorías
        if (categorias.length > 0) {
            try {
                const categoriasValues = categorias.map(catId => [plantaId, catId]);
                console.log('Insertando categorías:', categoriasValues);
                await db.query(
                    'INSERT INTO plantas_categorias (planta_id, id_categoria) VALUES ?',
                    [categoriasValues]
                );
            } catch (error) {
                console.error('Error al insertar categorías:', error);
                await db.query('DELETE FROM plantas WHERE id = ?', [plantaId]);
                return res.status(400).json({ 
                    error: 'Error al insertar las categorías',
                    details: error.message
                });
            }
        }
        
        // Procesar toxicidades
        let toxicidades = [];
        try {
            console.log('Toxicidades raw:', toxicidadesRaw);
            if (typeof toxicidadesRaw === 'string') {
                toxicidades = JSON.parse(toxicidadesRaw);
            } else if (Array.isArray(toxicidadesRaw)) {
                toxicidades = toxicidadesRaw;
            }
            if (!Array.isArray(toxicidades)) {
                throw new Error('Las toxicidades deben ser un array');
            }
            console.log('Toxicidades procesadas:', toxicidades);
        } catch (error) {
            console.error('Error al procesar toxicidades:', error);
            await db.query('DELETE FROM plantas WHERE id = ?', [plantaId]);
            return res.status(400).json({ 
                error: 'Error al procesar las toxicidades',
                details: error.message,
                toxicidades_recibidas: toxicidadesRaw
            });
        }
        
        if (toxicidades.length > 0) {
            try {
                const toxicidadesValues = toxicidades.map(t => {
                    const toxicidad = typeof t === 'string' ? JSON.parse(t) : t;
                    console.log('Procesando toxicidad:', toxicidad);
                    
                    if (!toxicidad.id) {
                        console.error('Toxicidad sin ID:', toxicidad);
                        throw new Error('ID de toxicidad no proporcionado');
                    }
                    
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

        // Procesar la imagen después de crear la planta
        if (req.files && req.files.length > 0) {
            const file = req.files[0];
            const targetPath = path.join(plantaDir, 'principal.jpg');
            
            try {
                // Mover el archivo a la ubicación correcta
                fs.copyFileSync(file.path, targetPath);
                fs.unlinkSync(file.path); // Eliminar el archivo temporal
                
                await db.query(
                    `INSERT INTO imagenes_plantas 
                     (planta_id, url, orden, es_principal) 
                     VALUES (?, ?, 0, 1)`,
                    [plantaId, 'principal.jpg']
                );
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
            }
        } else {
            // Si no hay imagen subida, copiar la imagen por defecto
            const defaultImagePath = path.join(__dirname, '../../frontend/src/assets/images/plantas/default/principal.jpg');
            const targetImagePath = path.join(plantaDir, 'principal.jpg');
            
            try {
                if (fs.existsSync(defaultImagePath)) {
                    fs.copyFileSync(defaultImagePath, targetImagePath);
                    console.log('Imagen por defecto copiada a:', targetImagePath);
                } else {
                    console.log('No se encontró la imagen por defecto, creando archivo vacío');
                    fs.writeFileSync(targetImagePath, '');
                }
                
                await db.query(
                    `INSERT INTO imagenes_plantas 
                     (planta_id, url, orden, es_principal) 
                     VALUES (?, ?, 0, 1)`,
                    [plantaId, 'principal.jpg']
                );
            } catch (error) {
                console.error('Error al copiar la imagen por defecto:', error);
            }
        }
        
        res.status(201).json({
            id: plantaId,
            nombre,
            message: 'Planta creada exitosamente'
        });
    } catch (error) {
        console.error('Error general en createPlanta:', error);
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

        // Parsear los datos de la planta
        let plantData;
        try {
            plantData = JSON.parse(req.body.plantData);
        } catch (error) {
            console.error('Error al parsear plantData:', error);
            return res.status(400).json({ 
                error: 'Error en el formato de los datos de la planta',
                details: error.message 
            });
        }

        // Extraer datos básicos
        const {
            nombre, 
            nombre_cientifico, 
            descripcion, 
            precio, 
            nivel_dificultad, 
            stock,
            categorias,
            toxicidades
        } = plantData;

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
        if (categorias && categorias.length > 0) {
            const categoriasValues = categorias.map(catId => [id, catId]);
            await db.query(
                'INSERT INTO plantas_categorias (planta_id, id_categoria) VALUES ?',
                [categoriasValues]
            );
        }

        // Actualizar toxicidades
        await db.query('DELETE FROM planta_toxicidad WHERE planta_id = ?', [id]);
        if (toxicidades && toxicidades.length > 0) {
            const toxicidadesValues = toxicidades.map(t => [id, t.id, t.detalles || '']);
            await db.query(
                'INSERT INTO planta_toxicidad (planta_id, toxicidad_id, detalles) VALUES ?',
                [toxicidadesValues]
            );
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

                // Crear el directorio para las imágenes si no existe
                const baseDir = path.join(__dirname, '../../frontend/src/assets/images/plantas');
                const plantaDir = path.join(baseDir, id);
                if (!fs.existsSync(plantaDir)) {
                    fs.mkdirSync(plantaDir, { recursive: true });
                }

                // Procesar cada imagen
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    const targetPath = path.join(plantaDir, 'principal.jpg');
                    
                    // Mover el archivo a la ubicación correcta
                    fs.copyFileSync(file.path, targetPath);
                    fs.unlinkSync(file.path); // Eliminar el archivo temporal

                    // Insertar en la base de datos
                    await db.query(
                        `INSERT INTO imagenes_plantas 
                         (planta_id, url, orden, es_principal) 
                         VALUES (?, ?, ?, ?)`,
                        [id, 'principal.jpg', startOrder + i, i === 0 ? 1 : 0]
                    );
                }
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
        console.log('Intentando eliminar planta con ID:', id);
        
        // Verificar si la planta existe
        const [plantas] = await db.query('SELECT * FROM plantas WHERE id = ?', [id]);
        if (plantas.length === 0) {
            console.log('Planta no encontrada con ID:', id);
            return res.status(404).json({ error: 'Planta no encontrada' });
        }
        
        console.log('Planta encontrada, actualizando estado activo a 0');
        
        // Borrado lógico en lugar de físico
        const [result] = await db.query('UPDATE plantas SET activo = 0 WHERE id = ?', [id]);
        
        console.log('Resultado de la actualización:', result);
        
        if (result.affectedRows === 0) {
            console.log('No se pudo actualizar la planta');
            return res.status(500).json({ error: 'No se pudo eliminar la planta' });
        }
        
        res.json({
            message: 'Planta desactivada exitosamente',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error('Error al eliminar planta:', error);
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
        console.log('Filtros recibidos:', { categoria, dificultad, precio_min, precio_max });
        
        let query = `
            SELECT DISTINCT p.*, 
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
        console.log('Plantas encontradas:', plantas.length);

        // Obtener las imágenes para cada planta
        for (let planta of plantas) {
            console.log('Procesando planta:', planta.id);
            const [imagenes] = await db.query(
                'SELECT * FROM imagenes_plantas WHERE planta_id = ? ORDER BY es_principal DESC',
                [planta.id]
            );
            console.log('Imágenes encontradas para planta', planta.id, ':', imagenes);
            
            if (imagenes.length > 0) {
                // Procesar las URLs de las imágenes para asegurar consistencia
                planta.imagenes = imagenes.map(img => ({
                    ...img,
                    url: img.url.startsWith('http') ? 
                        `assets/images/plantas/${planta.id}/principal.jpg` : 
                        img.url
                }));
                
                const imagenPrincipal = planta.imagenes.find(img => img.es_principal) || planta.imagenes[0];
                planta.imagen_principal = imagenPrincipal.url;
                console.log('Imagen principal establecida:', planta.imagen_principal);
            } else {
                planta.imagen_principal = 'principal.jpg';
                planta.imagenes = [{ url: 'principal.jpg', es_principal: true }];
                console.log('Usando imagen por defecto para planta:', planta.id);
            }
        }
        
        console.log('Primera planta de ejemplo:', JSON.stringify(plantas[0], null, 2));
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

// Agregar imagen a una planta existente
const addPlantaImage = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Verificar si la planta existe
        const [plantas] = await db.query('SELECT * FROM plantas WHERE id = ?', [id]);
        if (plantas.length === 0) {
            return res.status(404).json({ error: 'Planta no encontrada' });
        }
        
        // Crear el directorio para las imágenes si no existe
        const baseDir = path.join(__dirname, '../../frontend/src/assets/images/plantas');
        const plantaDir = path.join(baseDir, id);
        if (!fs.existsSync(plantaDir)) {
            fs.mkdirSync(plantaDir, { recursive: true });
            console.log('Directorio creado:', plantaDir);
        }
        
        // Procesar la imagen
        if (req.file) {
            const targetPath = path.join(plantaDir, 'principal.jpg');
            
            // Mover el archivo a la ubicación correcta
            fs.copyFileSync(req.file.path, targetPath);
            fs.unlinkSync(req.file.path); // Eliminar el archivo temporal
            
            // Actualizar la base de datos
            await db.query(
                `INSERT INTO imagenes_plantas 
                 (planta_id, url, orden, es_principal) 
                 VALUES (?, ?, 0, 1)`,
                [id, 'principal.jpg']
            );
            
            res.json({
                message: 'Imagen agregada exitosamente',
                path: targetPath
            });
        } else {
            res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
        }
    } catch (error) {
        console.error('Error al agregar imagen:', error);
        next(error);
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
    verifyToken,
    addPlantaImage
};