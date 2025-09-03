const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todas las categorías
router.get('/', async (req, res) => {
    try {
        const [categorias] = await db.query('SELECT * FROM categorias ORDER BY nombre ASC');
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
});

module.exports = router; 