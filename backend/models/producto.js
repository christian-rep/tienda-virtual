const express = require("express");
const router = express.Router();
const conectarDB = require("../database"); // Importar la conexión a MySQL

router.post("/productos", async (req, res) => {
    try {
        const { nombre, precio, descripcion, stock } = req.body; // Obtener datos del JSON
        const con = await conectarDB(); // Conectamos a MySQL
        const [result] = await con.execute(
            "INSERT INTO productos (nombre, precio, descripcion, stock) VALUES (?, ?, ?, ?)", 
            [nombre, precio, descripcion, stock]
        );

        res.status(201).json({ message: "✅ Producto agregado", id: result.insertId });
    } catch (error) {
        console.error("🔥 ERROR:", error);
        res.status(500).json({ error: "Ocurrió un error en el servidor" });
    }
});

module.exports = router;

