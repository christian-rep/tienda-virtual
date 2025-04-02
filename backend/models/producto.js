const connection = require('../db');

const Producto = {
    obtenerTodos: (callback) => {
        connection.query('SELECT * FROM productos', callback);
    }
};

module.exports = Producto;
