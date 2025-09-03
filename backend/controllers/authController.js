const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Usuario = require('../models/usuario');
const { enviarEmail } = require('../utils/email');

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

    // Verificar si el usuario está bloqueado
    const minutosBloqueado = await Usuario.verificarSiEstaBloqueado(email);
    if (minutosBloqueado !== null) {
      return res.status(423).json({ 
        mensaje: `Tu cuenta está bloqueada temporalmente. Intenta nuevamente en ${minutosBloqueado} minutos.`,
        bloqueado: true,
        minutosRestantes: minutosBloqueado
      });
    }

    // Buscar usuario
    const usuario = await Usuario.obtenerPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      // Incrementar intentos fallidos
      await Usuario.incrementarIntentosFallidos(email);
      const intentosFallidos = await Usuario.obtenerIntentosFallidos(email);
      
      // Si alcanzó 5 intentos fallidos, bloquear por 15 minutos
      if (intentosFallidos >= 5) {
        await Usuario.bloquearUsuario(email, 15);
        return res.status(423).json({ 
          mensaje: 'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por 15 minutos.',
          bloqueado: true,
          minutosRestantes: 15
        });
      }
      
      // Calcular intentos restantes
      const intentosRestantes = 5 - intentosFallidos;
      return res.status(401).json({ 
        mensaje: `Credenciales inválidas. Te quedan ${intentosRestantes} intentos antes del bloqueo.`,
        intentosRestantes
      });
    }

    // Si el login es exitoso, resetear intentos fallidos
    await Usuario.resetearIntentosFallidos(email);

    // Verificar si el usuario está activo y verificado
    if (!usuario.activo || !usuario.email_verificado) {
      return res.status(401).json({ 
        mensaje: 'Tu cuenta no está verificada. Por favor, verifica tu email antes de iniciar sesión.' 
      });
    }

    // Generar token
    const token = jwt.sign(
      { 
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
};

// Registro de usuario
exports.registro = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol = 'cliente' } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.obtenerPorEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Generar token de verificación
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const fechaExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Crear nuevo usuario con token de verificación
    const usuarioId = await Usuario.crear({
      nombre,
      apellido,
      email,
      password,
      rol,
      tokenVerificacion,
      fechaExpiracion
    });

    // Obtener el usuario creado para devolverlo
    const usuario = await Usuario.obtenerPorId(usuarioId);

    // Enviar email de verificación
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-email?token=${tokenVerificacion}`;
    
    await enviarEmail({
      to: email,
      subject: 'Verifica tu cuenta - Verdalia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">¡Bienvenido a Verdalia!</h2>
          <p>Hola ${nombre},</p>
          <p>Gracias por registrarte en Verdalia. Para completar tu registro, por favor verifica tu dirección de email haciendo clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #2c5530; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar Email</a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p>Este enlace expirará en 24 horas.</p>
          <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
          <br>
          <p>Saludos,<br>El equipo de Verdalia</p>
        </div>
      `
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente. Por favor, verifica tu email para activar tu cuenta.',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario' });
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
};

// Verificar token
exports.verificarToken = async (req, res) => {
  try {
    const usuario = await Usuario.obtenerPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({ mensaje: 'Error al verificar token' });
  }
};

// Obtener perfil
exports.obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.obtenerPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ mensaje: 'Error al obtener perfil' });
  }
};

// Actualizar perfil
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, telefono, direccion } = req.body;
    const usuario = await Usuario.actualizar(req.usuario.id, {
      nombre,
      apellido,
      telefono,
      direccion
    });

    res.json({
      mensaje: 'Perfil actualizado exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ mensaje: 'Error al actualizar perfil' });
  }
};

// Cambiar password
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const usuario = await Usuario.obtenerPorIdConPassword(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Verificar password actual
    const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Password actual incorrecto' });
    }

    // Actualizar password
    await Usuario.actualizarPassword(req.usuario.id, passwordNuevo);

    res.json({ mensaje: 'Password actualizado exitosamente' });
  } catch (error) {
    console.error('Error al cambiar password:', error);
    res.status(500).json({ mensaje: 'Error al cambiar password' });
  }
};

// Recuperar password
exports.recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.obtenerPorEmail(email);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Generar token temporal
    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Enviar email con link de recuperación
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await enviarEmail({
      to: usuario.email,
      subject: 'Recuperación de contraseña',
      text: `Para recuperar tu contraseña, haz clic en el siguiente enlace: ${resetLink}`
    });

    res.json({ mensaje: 'Se ha enviado un email con instrucciones' });
  } catch (error) {
    console.error('Error en recuperar password:', error);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.obtenerPorId(decoded.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Actualizar password
    await Usuario.actualizarPassword(usuario.id, password);

    res.json({ mensaje: 'Password actualizado exitosamente' });
  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({ mensaje: 'Error al restablecer password' });
  }
};

// Middleware para verificar token
exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No se proporcionó token de autenticación'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

// Obtener perfil del usuario
exports.getProfile = async (req, res) => {
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
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil'
        });
    }
};

// Actualizar perfil del usuario
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, apellido, email } = req.body;

        // Verificar si el email ya está en uso por otro usuario
        if (email) {
            const [existingUsers] = await db.query(
                'SELECT * FROM usuarios WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está en uso'
                });
            }
        }

        // Actualizar usuario
        await db.query(
            'UPDATE usuarios SET nombre = ?, apellido = ?, email = ? WHERE id = ?',
            [nombre, apellido, email, userId]
        );

        // Obtener usuario actualizado
        const [users] = await db.query(
            'SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            message: 'Perfil actualizado correctamente',
            user: users[0]
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el perfil'
        });
    }
};

// Método para desbloquear cuenta (solo para administradores)
exports.desbloquearCuenta = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verificar que el usuario que hace la petición sea admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        mensaje: 'No tienes permisos para realizar esta acción' 
      });
    }

    // Verificar si el usuario existe
    const usuario = await Usuario.obtenerPorEmail(email);
    if (!usuario) {
      return res.status(404).json({ 
        mensaje: 'Usuario no encontrado' 
      });
    }

    // Desbloquear la cuenta
    await Usuario.resetearIntentosFallidos(email);

    res.json({ 
      mensaje: `La cuenta de ${email} ha sido desbloqueada exitosamente` 
    });
  } catch (error) {
    console.error('Error al desbloquear cuenta:', error);
    res.status(500).json({ mensaje: 'Error al desbloquear la cuenta' });
  }
};

// Método para obtener información de bloqueo de una cuenta (solo para administradores)
exports.obtenerInfoBloqueo = async (req, res) => {
  try {
    const { email } = req.params;
    
    // Verificar que el usuario que hace la petición sea admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        mensaje: 'No tienes permisos para realizar esta acción' 
      });
    }

    // Verificar si el usuario existe
    const usuario = await Usuario.obtenerPorEmail(email);
    if (!usuario) {
      return res.status(404).json({ 
        mensaje: 'Usuario no encontrado' 
      });
    }

    // Obtener información de bloqueo
    const minutosBloqueado = await Usuario.verificarSiEstaBloqueado(email);
    const intentosFallidos = await Usuario.obtenerIntentosFallidos(email);

    res.json({
      email: usuario.email,
      bloqueado: minutosBloqueado !== null,
      minutosRestantes: minutosBloqueado,
      intentosFallidos: intentosFallidos
    });
  } catch (error) {
    console.error('Error al obtener información de bloqueo:', error);
    res.status(500).json({ mensaje: 'Error al obtener información de bloqueo' });
  }
};

// Eliminar o comentar el module.exports al final del archivo ya que los métodos ya están siendo exportados individualmente.
// module.exports = {
//     // ... existing exports ...
//     recuperarPassword,
//     resetPassword
// }; 