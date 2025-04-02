const db = require("../config/db");

// Obtener todos los productos
const getProducts = async (req, res, next) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM productos");
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

// Obtener un producto por ID
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.promise().query("SELECT * FROM productos WHERE id = ?", [id]);
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
        const { nombre, precio } = req.body;

        if (!nombre || typeof nombre !== 'string') {
            return res.status(400).json({ error: "El nombre es obligatorio y debe ser una cadena de texto." });
        }
        if (!precio || typeof precio !== 'number') {
            return res.status(400).json({ error: "El precio es obligatorio y debe ser un número." });
        }

        const [result] = await db.promise().query(
            "INSERT INTO productos (nombre, precio) VALUES (?, ?)", 
            [nombre, precio]
        );

        res.status(201).json({ id: result.insertId, nombre, precio });
    } catch (error) {
        next(error);
    }
};

// Actualizar un producto
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, precio } = req.body;

        const [result] = await db.promise().query(
            "UPDATE productos SET nombre = ?, precio = ? WHERE id = ?", 
            [nombre, precio, id]
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

        const [result] = await db.promise().query("DELETE FROM productos WHERE id = ?", [id]);

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
    deleteProduct,
};
