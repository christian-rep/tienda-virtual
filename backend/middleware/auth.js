const jwt = require('jsonwebtoken');

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';

module.exports = (req, res, next) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No se proporcionó token de autenticación' 
      });
    }

    // Verificar formato del token (Bearer TOKEN)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ 
        success: false, 
        message: 'Formato de token inválido' 
      });
    }

    const token = parts[1];

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Agregar la información del usuario al objeto request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
}; 