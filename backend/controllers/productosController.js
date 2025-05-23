const { db } = require("../db");

// Obtener todos los productos
const getProducts = async (req, res, next) => {
    try {
        const [rows] = await db.query("SELECT * FROM productos");
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

// Obtener un producto por ID
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query("SELECT * FROM productos WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// Crear un nuevo producto
const createProduct = async (req, res, next) => {
    try {
        const { nombre, descripcion = "", precio, stock = 0 } = req.body;

        if (!nombre || typeof nombre !== 'string') {
            return res.status(400).json({ error: "El nombre es obligatorio y debe ser una cadena de texto." });
        }
        if (!precio || typeof precio !== 'number') {
            return res.status(400).json({ error: "El precio es obligatorio y debe ser un número." });
        }

        const [result] = await db.query(
            "INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)", 
            [nombre, descripcion, precio, stock]
        );

        res.status(201).json({ id: result.insertId, nombre, descripcion, precio, stock });
    } catch (error) {
        next(error);
    }
};

// Actualizar un producto
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock } = req.body;

        // Validamos que al menos un campo sea proporcionado
        if (!nombre && !descripcion && precio == null && stock == null) {
            return res.status(400).json({ error: "Debe proporcionar al menos un dato para actualizar." });
        }

        const [result] = await db.query(
            `UPDATE productos 
            SET nombre = COALESCE(?, nombre), 
                descripcion = COALESCE(?, descripcion), 
                precio = COALESCE(?, precio), 
                stock = COALESCE(?, stock) 
            WHERE id = ?`, 
            [nombre, descripcion, precio, stock, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ message: "Producto actualizado correctamente" });
    } catch (error) {
        next(error);
    }
};

// Eliminar un producto
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await db.query("DELETE FROM productos WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
