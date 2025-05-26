const express = require('express');
const router = express.Router();
const plantasController = require('../controllers/plantasController');

// Rutas públicas
router.get('/', plantasController.getPlantas);
router.get('/search', plantasController.searchPlantas);
router.get('/filter', plantasController.filterPlantas);
router.get('/:id', plantasController.getPlantaById);

// Rutas protegidas (requieren autenticación)
router.post('/', 
    plantasController.verifyToken,
    plantasController.isAdmin,
    plantasController.handleImageUpload,
    plantasController.createPlanta
);

router.put('/:id', 
    plantasController.verifyToken,
    plantasController.isAdmin,
    plantasController.handleImageUpload,
    plantasController.updatePlanta
);

router.delete('/:id', 
    plantasController.verifyToken,
    plantasController.isAdmin,
    plantasController.deletePlanta
);

module.exports = router; 