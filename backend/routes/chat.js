const express = require('express');
const router = express.Router();
const { enviarMensaje, obtenerMensajes } = require('../controllers/chatController');

router.get('/', obtenerMensajes);
router.post('/', enviarMensaje);

module.exports = router;
