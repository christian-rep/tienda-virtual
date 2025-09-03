const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

// Rutas públicas
router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.post('/recuperar-password', authController.recuperarPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verificar-email', authController.verifyEmail);

// Rutas protegidas
router.get('/verificar-token', verificarToken, (req, res) => {
  res.json({ mensaje: 'Token válido', usuario: req.usuario });
});

router.get('/perfil', verificarToken, authController.obtenerPerfil);
router.put('/perfil', verificarToken, authController.actualizarPerfil);
router.put('/cambiar-password', verificarToken, authController.cambiarPassword);

// Rutas para administradores - manejo de bloqueo de cuentas
router.post('/desbloquear-cuenta', verificarToken, authController.desbloquearCuenta);
router.get('/info-bloqueo/:email', verificarToken, authController.obtenerInfoBloqueo);

module.exports = router; 