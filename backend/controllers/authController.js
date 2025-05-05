const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';
const JWT_EXPIRES_IN = '24h';

// Configuración del transporter de nodemailer con Mailtrap
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "beb1e132177614",
    pass: "481cb458328f7e"
  },
  //  debug: true, // Habilitar modo debug
  //  logger: true // Habilitar logs
});

// Verificar la conexión con Mailtrap
transporter.verify(function(error, success) {
  if (error) {
    console.error('Error al verificar la conexión con Mailtrap:', error);
  } else {
    console.log('Conexión con Mailtrap verificada correctamente');
  }
});

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

    // Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Tu cuenta no está activa. Por favor, verifica tu email.'
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

    console.log('Datos recibidos:', { nombre, apellido, email });

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

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    console.log('Intentando insertar usuario en la base de datos...');

    // Insertar nuevo usuario con activo = 0 (inactivo hasta verificar email)
    const [result] = await db.query(
      'INSERT INTO usuarios (id, nombre, apellido, email, password, rol, activo, token_verificacion, fecha_expiracion_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, nombre, apellido, email, hashedPassword, 'cliente', 0, verificationToken, verificationExpires]
    );

    console.log('Usuario insertado correctamente');

    // Enviar email de verificación
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-email?token=${verificationToken}`;
    
    console.log('Preparando envío de email a:', email);
    console.log('URL de verificación:', verificationUrl);
    
    try {
      const mailOptions = {
        from: '"Tienda de Plantas" <noreply@mailtrap.io>',
        to: email,
        subject: 'Verifica tu email - Tienda de Plantas',
        html: `
          <h1>Bienvenido a nuestra tienda de plantas!</h1>
          <p>Por favor, verifica tu email haciendo clic en el siguiente enlace:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
          <p>Este enlace expirará en 24 horas.</p>
        `
      };

      console.log('Opciones del email:', mailOptions);

      const info = await transporter.sendMail(mailOptions);
      console.log('Email enviado correctamente:', info.messageId);
      console.log('Respuesta del servidor SMTP:', info.response);
    } catch (emailError) {
      console.error('Error detallado al enviar el email:', emailError);
      // Si falla el envío del email, eliminamos el usuario
      await db.query('DELETE FROM usuarios WHERE id = ?', [userId]);
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el email de verificación',
        error: emailError.message
      });
    }

    const [newUserRows] = await db.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [userId]
    );
    
    const newUser = newUserRows[0];

    

    // Eliminar la contraseña del objeto de usuario
    const { password: _, ...userWithoutPassword } = newUser;

    // Enviar respuesta
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      token,
      message: 'Por favor, verifica tu email para activar tu cuenta'
    });
  } catch (error) {
    console.error('Error detallado en registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor',
      error: error.message
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
/*
// Nuevo método para verificar el email
exports.verifyEmail = async (req, res) => {
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
      message: 'Email verificado correctamente. Tu cuenta ha sido activada.'
    });
  } catch (error) {
    console.error('Error en verificación de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
}; */