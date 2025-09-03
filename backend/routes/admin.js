const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación y verificación de admin a todas las rutas
router.use(verificarToken);
router.use(verificarAdmin);

// Rutas para usuarios
router.get('/usuarios', usuarioController.obtenerUsuarios);
router.get('/usuarios/:id', usuarioController.obtenerUsuario);
router.post('/usuarios', usuarioController.crearUsuario);
router.put('/usuarios/:id', usuarioController.actualizarUsuario);
router.delete('/usuarios/:id', usuarioController.eliminarUsuario);

module.exports = router; 