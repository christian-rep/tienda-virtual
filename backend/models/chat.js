const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  usuario: String,
  mensaje: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);
