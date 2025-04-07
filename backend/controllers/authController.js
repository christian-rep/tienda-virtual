const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';
const JWT_EXPIRES_IN = '24h';

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que el email y password estén presentes
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor, proporcione email y contraseña' 
      });
    }

    // Buscar usuario en la base de datos
    const [users] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    const user = users[0];

    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Crear token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        rol: user.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Eliminar la contraseña del objeto de usuario
    const { password: _, ...userWithoutPassword } = user;

    // Enviar respuesta
    res.status(200).json({
      success: true,
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
};

// Registro de usuario
exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor, complete todos los campos requeridos' 
      });
    }

    // Verificar si el email ya está registrado
    const [existingUsers] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'El email ya está registrado' 
      });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generar un ID único
    const userId = uuidv4();

    // Insertar nuevo usuario
    const [result] = await db.query(
      'INSERT INTO usuarios (id, nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, nombre, apellido, email, hashedPassword, 'user']
    );

    const [newUserRows] = await db.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [userId]
    );
    
    const newUser = newUserRows[0];

    // Crear token JWT
    const token = jwt.sign(
      { 
        id: newUser.id,
        email: newUser.email,
        rol: newUser.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Eliminar la contraseña del objeto de usuario
    const { password: _, ...userWithoutPassword } = newUser;

    // Enviar respuesta
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
};

// Obtener información del usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      'SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = ?',
      [userId]
    );

    const user = users[0];

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
}; 