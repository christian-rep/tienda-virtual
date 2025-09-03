const express = require('express');
const router = express.Router();
const plantasController = require('../controllers/plantasController');
const { verifyToken, isAdmin, handleImageUpload } = require('../controllers/plantasController');

// Rutas públicas
router.get('/', plantasController.getPlantas);
router.get('/buscar', plantasController.searchPlantas);
router.get('/filtrar', plantasController.filterPlantas);
router.get('/:id', plantasController.getPlantaById);

// Rutas protegidas (requieren autenticación y rol admin)
router.post('/', verifyToken, isAdmin, handleImageUpload, plantasController.createPlanta);
router.put('/:id', verifyToken, isAdmin, handleImageUpload, plantasController.updatePlanta);
router.delete('/:id', verifyToken, isAdmin, plantasController.deletePlanta);
router.put('/:id/imagen', verifyToken, isAdmin, handleImageUpload, plantasController.addPlantaImage);

module.exports = router; 