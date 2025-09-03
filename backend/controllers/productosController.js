const db = require("../config/db");

// Obtener todos los productos
const getProducts = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, 
                   GROUP_CONCAT(c.nombre) as categorias
            FROM plantas p
            LEFT JOIN plantas_categorias pc ON p.id = pc.planta_id
            LEFT JOIN categorias c ON pc.id_categoria = c.id
            WHERE p.activo = 1
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error en getProducts:', error);
        next(error);
    }
};

// Obtener un producto por ID
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT p.*, 
                   GROUP_CONCAT(c.nombre) as categorias
            FROM plantas p
            LEFT JOIN plantas_categorias pc ON p.id = pc.planta_id
            LEFT JOIN categorias c ON pc.id_categoria = c.id
            WHERE p.id = ? AND p.activo = 1
            GROUP BY p.id
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error en getProductById:', error);
        next(error);
    }
};

// Filtrar productos
const filtrarProductos = async (req, res, next) => {
    try {
        const { categoria, dificultad, precio_min, precio_max } = req.query;
        
        let query = `
            SELECT DISTINCT p.*, 
                   GROUP_CONCAT(c.nombre) as categorias
            FROM plantas p
            LEFT JOIN plantas_categorias pc ON p.id = pc.planta_id
            LEFT JOIN categorias c ON pc.id_categoria = c.id
            WHERE p.activo = 1
        `;
        
        const params = [];
        
        // Filtro por categoría
        if (categoria && categoria !== 'undefined') {
            query += ` AND pc.id_categoria = ?`;
            params.push(categoria);
        }
        
        // Filtro por dificultad
        if (dificultad && dificultad !== 'undefined') {
            query += ` AND p.nivel_dificultad = ?`;
            params.push(dificultad);
        }
        
        // Filtro por precio mínimo
        if (precio_min && precio_min !== 'undefined') {
            query += ` AND p.precio >= ?`;
            params.push(parseFloat(precio_min));
        }
        
        // Filtro por precio máximo
        if (precio_max && precio_max !== 'undefined') {
            query += ` AND p.precio <= ?`;
            params.push(parseFloat(precio_max));
        }
        
        query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error en filtrarProductos:', error);
        next(error);
    }
};

// Crear un nuevo producto
const createProduct = async (req, res, next) => {
    try {
        const { nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock, categorias } = req.body;

        if (!nombre || typeof nombre !== 'string') {
            return res.status(400).json({ error: "El nombre es obligatorio y debe ser una cadena de texto." });
        }
        if (!precio || typeof precio !== 'number') {
            return res.status(400).json({ error: "El precio es obligatorio y debe ser un número." });
        }

        // Insertar la planta
        const [result] = await db.query(
            `INSERT INTO plantas 
             (nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock, activo) 
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock || 0]
        );

        const plantaId = result.insertId;

        // Si se proporcionaron categorías, agregarlas
        if (categorias && Array.isArray(categorias)) {
            for (const categoriaId of categorias) {
                await db.query(
                    'INSERT INTO plantas_categorias (planta_id, id_categoria, es_principal) VALUES (?, ?, ?)',
                    [plantaId, categoriaId, 0]
                );
            }
        }

        res.status(201).json({ 
            id: plantaId, 
            nombre, 
            nombre_cientifico, 
            descripcion, 
            precio, 
            nivel_dificultad, 
            stock
        });
    } catch (error) {
        console.error('Error en createProduct:', error);
        next(error);
    }
};

// Actualizar un producto
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock, categorias } = req.body;

        // Validamos que al menos un campo sea proporcionado
        if (!nombre && !nombre_cientifico && !descripcion && precio == null && !nivel_dificultad && stock == null) {
            return res.status(400).json({ error: "Debe proporcionar al menos un dato para actualizar." });
        }

        const [result] = await db.query(
            `UPDATE plantas 
            SET nombre = COALESCE(?, nombre), 
                nombre_cientifico = COALESCE(?, nombre_cientifico),
                descripcion = COALESCE(?, descripcion), 
                precio = COALESCE(?, precio), 
                nivel_dificultad = COALESCE(?, nivel_dificultad),
                stock = COALESCE(?, stock) 
            WHERE id = ?`, 
            [nombre, nombre_cientifico, descripcion, precio, nivel_dificultad, stock, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        // Si se proporcionaron categorías, actualizarlas
        if (categorias && Array.isArray(categorias)) {
            // Eliminar categorías existentes
            await db.query('DELETE FROM plantas_categorias WHERE planta_id = ?', [id]);
            
            // Agregar nuevas categorías
            for (const categoriaId of categorias) {
                await db.query(
                    'INSERT INTO plantas_categorias (planta_id, id_categoria, es_principal) VALUES (?, ?, ?)',
                    [id, categoriaId, 0]
                );
            }
        }

        res.json({ message: "Producto actualizado correctamente" });
    } catch (error) {
        console.error('Error en updateProduct:', error);
        next(error);
    }
};

// Eliminar un producto
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Soft delete - marcar como inactivo en lugar de eliminar
        const [result] = await db.query("UPDATE plantas SET activo = 0 WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        console.error('Error en deleteProduct:', error);
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    filtrarProductos,
    createProduct,
    updateProduct,
    deleteProduct
};
