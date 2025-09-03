const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

// Rutas protegidas
router.get('/', verificarToken, (req, res) => {
  res.json({ mensaje: 'Lista de pedidos' });
});

router.post('/', verificarToken, (req, res) => {
  res.json({ mensaje: 'Pedido creado' });
});

router.get('/:id', verificarToken, (req, res) => {
  res.json({ mensaje: 'Detalle del pedido' });
});

router.put('/:id', verificarToken, (req, res) => {
  res.json({ mensaje: 'Pedido actualizado' });
});

router.delete('/:id', verificarToken, (req, res) => {
  res.json({ mensaje: 'Pedido eliminado' });
});

module.exports = router; 