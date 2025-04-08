const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Obtener todas las plantas
const getPlantas = async (req, res, next) => {
    try {
        const [plantas] = await db.query('SELECT * FROM plantas');
        
        // Convertir el campo beneficios de texto a array si existe
        plantas.forEach(planta => {
            if (planta.beneficios) {
                planta.beneficios = planta.beneficios.split(',').map(b => b.trim());
            } else {
                planta.beneficios = [];
            }
        });
        
        res.json(plantas);
    } catch (error) {
        next(error);
    }
};

// Obtener una planta por ID
const getPlantaById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [plantas] = await db.query('SELECT * FROM plantas WHERE id = ?', [id]);
        
        if (plantas.length === 0) {
            return res.status(404).json({ error: 'Planta no encontrada' });
        }
        
        const planta = plantas[0];
        
        // Convertir el campo beneficios de texto a array si existe
        if (planta.beneficios) {
            planta.beneficios = planta.beneficios.split(',').map(b => b.trim());
        } else {
            planta.beneficios = [];
        }
        
        res.json(planta);
    } catch (error) {
        next(error);
    }
};

// Crear una nueva planta
const createPlanta = async (req, res, next) => {
    try {
        const {
            nombre, nombreCientifico, descripcion, precio, imagen,
            tipoPlanta, alturaCm, anchoCm, tipoHoja, colorHojas, colorFlores, epocaFloracion,
            tipoSuelo, nivelLuz, frecuenciaRiego, temperaturaMinC, temperaturaMaxC, humedadRequerida,
            beneficios, toxicidad, nivelDificultad, stock
        } = req.body;
        
        // Validaciones básicas
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }
        if (!descripcion) {
            return res.status(400).json({ error: 'La descripción es obligatoria' });
        }
        if (!precio || isNaN(precio)) {
            return res.status(400).json({ error: 'El precio debe ser un número válido' });
        }
        if (!tipoPlanta) {
            return res.status(400).json({ error: 'El tipo de planta es obligatorio' });
        }
        if (!nivelLuz) {
            return res.status(400).json({ error: 'El nivel de luz es obligatorio' });
        }
        if (!frecuenciaRiego) {
            return res.status(400).json({ error: 'La frecuencia de riego es obligatoria' });
        }
        if (!nivelDificultad) {
            return res.status(400).json({ error: 'El nivel de dificultad es obligatorio' });
        }
        
        // Convertir el array de beneficios a texto si existe
        const beneficiosStr = beneficios ? 
            (Array.isArray(beneficios) ? beneficios.join(', ') : beneficios) : null;
        
        // Generar un ID único
        const id = uuidv4();
        
        // Insertar la planta en la base de datos
        await db.query(
            `INSERT INTO plantas (
                id, nombre, nombreCientifico, descripcion, precio, imagen,
                tipoPlanta, alturaCm, anchoCm, tipoHoja, colorHojas, colorFlores, epocaFloracion,
                tipoSuelo, nivelLuz, frecuenciaRiego, temperaturaMinC, temperaturaMaxC, humedadRequerida,
                beneficios, toxicidad, nivelDificultad, stock
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, nombre, nombreCientifico, descripcion, precio, imagen,
                tipoPlanta, alturaCm, anchoCm, tipoHoja, colorHojas, colorFlores, epocaFloracion,
                tipoSuelo, nivelLuz, frecuenciaRiego, temperaturaMinC, temperaturaMaxC, humedadRequerida,
                beneficiosStr, toxicidad, nivelDificultad, stock || 0
            ]
        );
        
        res.status(201).json({
            id,
            nombre,
            mensaje: 'Planta creada exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar una planta
const updatePlanta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            nombre, nombreCientifico, descripcion, precio, imagen,
            tipoPlanta, alturaCm, anchoCm, tipoHoja, colorHojas, colorFlores, epocaFloracion,
            tipoSuelo, nivelLuz, frecuenciaRiego, temperaturaMinC, temperaturaMaxC, humedadRequerida,
            beneficios, toxicidad, nivelDificultad, stock
        } = req.body;
        
        // Verificar si la planta existe
        const [plantas] = await db.query('SELECT * FROM plantas WHERE id = ?', [id]);
        if (plantas.length === 0) {
            return res.status(404).json({ error: 'Planta no encontrada' });
        }
        
        // Convertir el array de beneficios a texto si existe
        const beneficiosStr = beneficios ? 
            (Array.isArray(beneficios) ? beneficios.join(', ') : beneficios) : null;
        
        // Actualizar la planta
        await db.query(
            `UPDATE plantas SET
                nombre = COALESCE(?, nombre),
                nombreCientifico = COALESCE(?, nombreCientifico),
                descripcion = COALESCE(?, descripcion),
                precio = COALESCE(?, precio),
                imagen = COALESCE(?, imagen),
                tipoPlanta = COALESCE(?, tipoPlanta),
                alturaCm = COALESCE(?, alturaCm),
                anchoCm = COALESCE(?, anchoCm),
                tipoHoja = COALESCE(?, tipoHoja),
                colorHojas = COALESCE(?, colorHojas),
                colorFlores = COALESCE(?, colorFlores),
                epocaFloracion = COALESCE(?, epocaFloracion),
                tipoSuelo = COALESCE(?, tipoSuelo),
                nivelLuz = COALESCE(?, nivelLuz),
                frecuenciaRiego = COALESCE(?, frecuenciaRiego),
                temperaturaMinC = COALESCE(?, temperaturaMinC),
                temperaturaMaxC = COALESCE(?, temperaturaMaxC),
                humedadRequerida = COALESCE(?, humedadRequerida),
                beneficios = COALESCE(?, beneficios),
                toxicidad = COALESCE(?, toxicidad),
                nivelDificultad = COALESCE(?, nivelDificultad),
                stock = COALESCE(?, stock)
            WHERE id = ?`,
            [
                nombre, nombreCientifico, descripcion, precio, imagen,
                tipoPlanta, alturaCm, anchoCm, tipoHoja, colorHojas, colorFlores, epocaFloracion,
                tipoSuelo, nivelLuz, frecuenciaRiego, temperaturaMinC, temperaturaMaxC, humedadRequerida,
                beneficiosStr, toxicidad, nivelDificultad, stock, id
            ]
        );
        
        res.json({
            id,
            mensaje: 'Planta actualizada exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar una planta
const deletePlanta = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Verificar si la planta existe
        const [plantas] = await db.query('SELECT * FROM plantas WHERE id = ?', [id]);
        if (plantas.length === 0) {
            return res.status(404).json({ error: 'Planta no encontrada' });
        }
        
        // Eliminar la planta
        await db.query('DELETE FROM plantas WHERE id = ?', [id]);
        
        res.json({
            mensaje: 'Planta eliminada exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// Buscar plantas por término
const searchPlantas = async (req, res, next) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
        }
        
        const searchTerm = `%${q}%`;
        
        const [plantas] = await db.query(
            `SELECT * FROM plantas 
            WHERE nombre LIKE ? 
            OR nombreCientifico LIKE ? 
            OR descripcion LIKE ?
            OR tipoPlanta LIKE ?`,
            [searchTerm, searchTerm, searchTerm, searchTerm]
        );
        
        // Convertir el campo beneficios de texto a array si existe
        plantas.forEach(planta => {
            if (planta.beneficios) {
                planta.beneficios = planta.beneficios.split(',').map(b => b.trim());
            } else {
                planta.beneficios = [];
            }
        });
        
        res.json(plantas);
    } catch (error) {
        next(error);
    }
};

// Filtrar plantas por criterios
const filterPlantas = async (req, res, next) => {
    try {
        const { tipoPlanta, nivelLuz, nivelDificultad, frecuenciaRiego } = req.query;
        
        let query = 'SELECT * FROM plantas WHERE 1=1';
        const params = [];
        
        if (tipoPlanta) {
            query += ' AND tipoPlanta = ?';
            params.push(tipoPlanta);
        }
        
        if (nivelLuz) {
            query += ' AND nivelLuz = ?';
            params.push(nivelLuz);
        }
        
        if (nivelDificultad) {
            query += ' AND nivelDificultad = ?';
            params.push(nivelDificultad);
        }
        
        if (frecuenciaRiego) {
            query += ' AND frecuenciaRiego = ?';
            params.push(frecuenciaRiego);
        }
        
        const [plantas] = await db.query(query, params);
        
        // Convertir el campo beneficios de texto a array si existe
        plantas.forEach(planta => {
            if (planta.beneficios) {
                planta.beneficios = planta.beneficios.split(',').map(b => b.trim());
            } else {
                planta.beneficios = [];
            }
        });
        
        res.json(plantas);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPlantas,
    getPlantaById,
    createPlanta,
    updatePlanta,
    deletePlanta,
    searchPlantas,
    filterPlantas
}; 