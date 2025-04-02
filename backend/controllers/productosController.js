const db = require('../config/db');

exports.obtenerProductos = (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.crearProducto = (req, res) => {
  const { nombre, precio, stock } = req.body;
  db.query('INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)', [nombre, precio, stock], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Producto agregado', id: results.insertId });
  });
};

