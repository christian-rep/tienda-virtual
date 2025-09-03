const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class Usuario {
    static async crear({ nombre, apellido, email, password, rol = 'cliente', telefono = null, direccion = null, tokenVerificacion = null, fechaExpiracion = null }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        const [result] = await pool.execute(
            'INSERT INTO usuarios (id, nombre, apellido, email, password, rol, telefono, direccion, token_verificacion, fecha_expiracion_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, nombre, apellido, email, hashedPassword, rol, telefono, direccion, tokenVerificacion, fechaExpiracion]
        );
        return id;
    }

    static async obtenerPorId(id) {
        const [rows] = await pool.execute(
            'SELECT id, nombre, apellido, email, rol, telefono, direccion, activo FROM usuarios WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async obtenerPorIdConPassword(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM usuarios WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async obtenerPorEmail(email) {
        const [rows] = await pool.execute(
            'SELECT id, nombre, apellido, email, password, rol, telefono, direccion, activo, email_verificado, intentos_fallidos, bloqueado_hasta FROM usuarios WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async obtenerTodos() {
        const [rows] = await pool.execute(
            'SELECT id, nombre, apellido, email, rol, telefono, direccion, activo FROM usuarios'
        );
        return rows;
    }

    static async actualizar(id, { nombre, apellido, email, rol, activo, telefono, direccion }) {
        // Construir la consulta dinámicamente basada en los campos proporcionados
        const updates = [];
        const values = [];
        
        if (nombre !== undefined) {
            updates.push('nombre = ?');
            values.push(nombre);
        }
        if (apellido !== undefined) {
            updates.push('apellido = ?');
            values.push(apellido);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        if (rol !== undefined) {
            updates.push('rol = ?');
            values.push(rol);
        }
        if (activo !== undefined) {
            updates.push('activo = ?');
            values.push(activo);
        }
        if (telefono !== undefined) {
            updates.push('telefono = ?');
            values.push(telefono);
        }
        if (direccion !== undefined) {
            updates.push('direccion = ?');
            values.push(direccion);
        }
        
        if (updates.length === 0) {
            throw new Error('No se proporcionaron campos para actualizar');
        }
        
        values.push(id);
        const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
        
        const [result] = await pool.execute(query, values);
        if (result.affectedRows === 0) {
            throw new Error('Usuario no encontrado');
        }
        return this.obtenerPorId(id);
    }

    static async actualizarPassword(id, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'UPDATE usuarios SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Usuario no encontrado');
        }
    }

    static async eliminar(id) {
        const [result] = await pool.execute(
            'DELETE FROM usuarios WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Usuario no encontrado');
        }
    }

    static async verificarPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    // Métodos para manejo de intentos fallidos
    static async incrementarIntentosFallidos(email) {
        const [result] = await pool.execute(
            'UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE email = ?',
            [email]
        );
        return result.affectedRows > 0;
    }

    static async resetearIntentosFallidos(email) {
        const [result] = await pool.execute(
            'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE email = ?',
            [email]
        );
        return result.affectedRows > 0;
    }

    static async bloquearUsuario(email, minutosBloqueo = 15) {
        const fechaBloqueo = new Date();
        fechaBloqueo.setMinutes(fechaBloqueo.getMinutes() + minutosBloqueo);
        
        const [result] = await pool.execute(
            'UPDATE usuarios SET bloqueado_hasta = ? WHERE email = ?',
            [fechaBloqueo, email]
        );
        return result.affectedRows > 0;
    }

    static async verificarSiEstaBloqueado(email) {
        const [rows] = await pool.execute(
            'SELECT bloqueado_hasta FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (rows.length === 0) return null;
        
        const bloqueadoHasta = rows[0].bloqueado_hasta;
        if (!bloqueadoHasta) return null;
        
        const ahora = new Date();
        const fechaBloqueo = new Date(bloqueadoHasta);
        
        if (ahora < fechaBloqueo) {
            // Calcular minutos restantes
            const diffMs = fechaBloqueo - ahora;
            const diffMins = Math.ceil(diffMs / (1000 * 60));
            return diffMins;
        }
        
        // Si ya pasó el tiempo de bloqueo, desbloquear
        await this.resetearIntentosFallidos(email);
        return null;
    }

    static async obtenerIntentosFallidos(email) {
        const [rows] = await pool.execute(
            'SELECT intentos_fallidos FROM usuarios WHERE email = ?',
            [email]
        );
        return rows.length > 0 ? rows[0].intentos_fallidos : 0;
    }
}

module.exports = Usuario;
