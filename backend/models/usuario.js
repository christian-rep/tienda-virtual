const connection = require('../db');

const Usuario = {
    crear: (nombre, email, password, callback) => {
        const query = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
        connection.query(query, [nombre, email, password], callback);
    }
};

module.exports = Usuario;
