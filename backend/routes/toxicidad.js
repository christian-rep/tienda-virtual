const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todos los niveles de toxicidad
router.get('/', async (req, res) => {
    try {
        const [niveles] = await db.query('SELECT * FROM toxicidad ORDER BY nivel ASC');
        res.json(niveles);
    } catch (error) {
        console.error('Error al obtener niveles de toxicidad:', error);
        res.status(500).json({ error: 'Error al obtener los niveles de toxicidad' });
    }
});

module.exports = router; 