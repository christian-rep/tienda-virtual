const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';
const Usuario = require('../models/usuario');

const verificarToken = (req, res, next) => {
  try {
    // Obtener el token del header
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(403).json({ error: 'Token no proporcionado' });
    }

    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Agregar el usuario decodificado a la request
    req.usuarioId = decoded.id;
    
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const verificarAdmin = (req, res, next) => {
  const usuarioId = req.usuarioId;

  Usuario.verificarAdmin(usuarioId, (error, esAdmin) => {
    if (error) {
      return res.status(500).json({ error: 'Error al verificar rol de administrador' });
    }

    if (!esAdmin) {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador' });
    }

    next();
  });
};

module.exports = {
  verificarToken,
  verificarAdmin
}; 