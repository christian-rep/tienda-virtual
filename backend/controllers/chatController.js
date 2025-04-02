const Chat = require('../models/chat');

exports.obtenerMensajes = async (req, res) => {
  try {
    const mensajes = await Chat.find().sort({ createdAt: -1 });
    res.json(mensajes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enviarMensaje = async (req, res) => {
  try {
    const { usuario, mensaje } = req.body;
    const nuevoMensaje = new Chat({ usuario, mensaje });
    await nuevoMensaje.save();
    res.json({ message: 'Mensaje guardado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
