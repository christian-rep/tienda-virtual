const db = require('../config/db');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario');

// Obtener todos los usuarios
exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.obtenerTodos();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

// Obtener usuario por ID
exports.obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.obtenerPorId(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuario' });
  }
};

// Crear usuario
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol = 'cliente', telefono, direccion } = req.body;
    
    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.obtenerPorEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Crear el usuario
    const usuarioId = await Usuario.crear({
      nombre,
      apellido,
      email,
      password,
      rol,
      telefono,
      direccion
    });

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuarioId
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ mensaje: 'Error al crear usuario' });
  }
};

// Actualizar usuario
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, rol, activo } = req.body;
    
    const usuario = await Usuario.actualizar(id, {
      nombre,
      apellido,
      email,
      rol,
      activo
    });

    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar usuario' });
  }
};

// Eliminar usuario
exports.eliminarUsuario = async (req, res) => {
  try {
    await Usuario.eliminar(req.params.id);
    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
};

// Obtener perfil del usuario actual
exports.obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.obtenerPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      rol: usuario.rol
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ mensaje: 'Error al obtener perfil' });
  }
};

// Actualizar perfil del usuario actual
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, telefono, direccion } = req.body;
    const usuario = await Usuario.actualizar(req.usuario.id, {
      nombre,
      apellido,
      telefono,
      direccion
    });
    res.json({
      mensaje: 'Perfil actualizado exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ mensaje: 'Error al actualizar perfil' });
  }
};

// Cambiar contraseña
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const usuario = await Usuario.obtenerPorId(req.usuario.id);

    // Verificar password actual
    const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Password actual incorrecto' });
    }

    // Actualizar password
    await Usuario.actualizarPassword(req.usuario.id, passwordNuevo);

    res.json({ mensaje: 'Password actualizado exitosamente' });
  } catch (error) {
    console.error('Error al cambiar password:', error);
    res.status(500).json({ mensaje: 'Error al cambiar password' });
  }
};
