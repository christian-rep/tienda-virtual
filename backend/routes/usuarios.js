const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verificarToken, isAdmin } = require('../middleware/auth');

// Rutas públicas
router.post('/registro', usuariosController.crearUsuario);

// Rutas protegidas (requieren autenticación)
router.get('/perfil', verificarToken, usuariosController.obtenerPerfil);
router.put('/perfil', verificarToken, usuariosController.actualizarPerfil);
router.put('/cambiar-password', verificarToken, usuariosController.cambiarPassword);

// Rutas de administrador
router.get('/', verificarToken, isAdmin, usuariosController.obtenerUsuarios);
router.get('/:id', verificarToken, isAdmin, usuariosController.obtenerUsuarioPorId);
router.put('/:id', verificarToken, isAdmin, usuariosController.actualizarUsuario);
router.delete('/:id', verificarToken, isAdmin, usuariosController.eliminarUsuario);

module.exports = router;
