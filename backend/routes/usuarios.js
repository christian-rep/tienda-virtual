const express = require('express');
const router = express.Router();
const { obtenerUsuarios, crearUsuario, obtenerUsuarioPorId } = require('../controllers/usuariosController');

// Rutas públicas
router.get('/', obtenerUsuarios);
router.post('/', crearUsuario);
router.get('/:id', obtenerUsuarioPorId);

module.exports = router;
