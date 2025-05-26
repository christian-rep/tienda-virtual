const express = require('express');
const router = express.Router();
const toxicidadController = require('../controllers/toxicidadController');

// Rutas públicas
router.get('/', toxicidadController.getToxicidadLevels);

module.exports = router; 