const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.obtenerUsuarios = (req, res) => {
  db.query('SELECT id, nombre, apellido, email, rol, created_at FROM usuarios', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.crearUsuario = async (req, res) => {
  const { nombre, apellido, email, password } = req.body;
  
  // Validar campos requeridos
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
  }
  
  try {
    // Verificar si el email ya existe
    const [existingUsers] = await db.promise().query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insertar el usuario
    const [result] = await db.promise().query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido || '', email, hashedPassword, 'user']
    );
    
    res.status(201).json({ 
      message: 'Usuario creado correctamente', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

exports.obtenerUsuarioPorId = (req, res) => {
  const { id } = req.params;
  
  db.query(
    'SELECT id, nombre, apellido, email, rol, created_at FROM usuarios WHERE id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json(results[0]);
    }
  );
};
