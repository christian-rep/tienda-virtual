const express = require('express');
const router = express.Router();
const plantasController = require('../controllers/plantasController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Rutas públicas
router.get('/', plantasController.getPlantas);
router.get('/search', plantasController.searchPlantas);
router.get('/filter', plantasController.filterPlantas);
router.get('/:id', plantasController.getPlantaById);

// Rutas protegidas (solo admin)
router.post('/', isAuthenticated, isAdmin, plantasController.createPlanta);
router.put('/:id', isAuthenticated, isAdmin, plantasController.updatePlanta);
router.delete('/:id', isAuthenticated, isAdmin, plantasController.deletePlanta);

module.exports = router; 