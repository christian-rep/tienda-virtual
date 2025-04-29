const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');

// Rutas públicas
router.get('/', categoriasController.getCategorias);

module.exports = router; 