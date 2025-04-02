const db = require('../config/db');

exports.obtenerUsuarios = (req, res) => {
  db.query('SELECT * FROM usuarios', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.crearUsuario = (req, res) => {
  const { nombre, email } = req.body;
  db.query('INSERT INTO usuarios (nombre, email) VALUES (?, ?)', [nombre, email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Usuario creado', id: results.insertId });
  });
};
