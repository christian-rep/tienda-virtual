-- Script para crear la tabla de plantas
CREATE TABLE IF NOT EXISTS plantas (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nombreCientifico VARCHAR(100),
    descripcion TEXT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    imagen VARCHAR(255),
    
    -- Características de la planta
    tipoPlanta ENUM('interior', 'exterior', 'suculenta', 'cactus', 'aromatica') NOT NULL,
    alturaCm INT,
    anchoCm INT,
    tipoHoja VARCHAR(50),
    colorHojas VARCHAR(50),
    colorFlores VARCHAR(50),
    epocaFloracion VARCHAR(50),
    
    -- Requerimientos
    tipoSuelo VARCHAR(50),
    nivelLuz ENUM('sombra', 'parcial', 'pleno') NOT NULL,
    frecuenciaRiego ENUM('bajo', 'medio', 'alto') NOT NULL,
    temperaturaMinC INT,
    temperaturaMaxC INT,
    humedadRequerida ENUM('baja', 'media', 'alta'),
    
    -- Información adicional
    beneficios TEXT,
    toxicidad VARCHAR(50),
    nivelDificultad ENUM('principiante', 'intermedio', 'experto') NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    
    -- Timestamps
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar algunas plantas de ejemplo
INSERT INTO plantas (
    id, nombre, nombreCientifico, descripcion, precio, imagen,
    tipoPlanta, alturaCm, anchoCm, tipoHoja, colorHojas, colorFlores, epocaFloracion,
    tipoSuelo, nivelLuz, frecuenciaRiego, temperaturaMinC, temperaturaMaxC, humedadRequerida,
    beneficios, toxicidad, nivelDificultad, stock
) VALUES
(
    UUID(), 'Pothos', 'Epipremnum aureum', 'Planta trepadora de fácil cuidado, ideal para principiantes.', 1500.00, 'https://example.com/pothos.jpg',
    'interior', 30, 20, 'perenne', 'verde variegado', NULL, NULL,
    'estándar', 'parcial', 'medio', 15, 28, 'media',
    'Purificación del aire, Fácil propagación', 'Tóxico para mascotas', 'principiante', 25
),
(
    UUID(), 'Sábila', 'Aloe vera', 'Planta suculenta con propiedades medicinales.', 1200.00, 'https://example.com/aloe.jpg',
    'suculenta', 40, 30, 'perenne', 'verde', NULL, NULL,
    'arenoso', 'pleno', 'bajo', 10, 35, 'baja',
    'Propiedades medicinales, Purificación del aire', 'No tóxico', 'principiante', 30
),
(
    UUID(), 'Lavanda', 'Lavandula', 'Planta aromática con flores de color púrpura.', 1800.00, 'https://example.com/lavanda.jpg',
    'aromatica', 60, 40, 'perenne', 'gris-verde', 'púrpura', 'verano',
    'arenoso', 'pleno', 'bajo', 5, 30, 'baja',
    'Aromática, Repelente de insectos', 'No tóxico', 'intermedio', 15
),
(
    UUID(), 'Monstera', 'Monstera deliciosa', 'Planta de interior con hojas grandes y perforadas.', 2500.00, 'https://example.com/monstera.jpg',
    'interior', 100, 80, 'perenne', 'verde oscuro', NULL, NULL,
    'estándar', 'parcial', 'medio', 18, 30, 'media',
    'Decorativa, Purificación del aire', 'Tóxico para mascotas', 'intermedio', 10
),
(
    UUID(), 'Cactus de Navidad', 'Schlumbergera bridgesii', 'Cactus que florece en invierno con flores coloridas.', 1300.00, 'https://example.com/cactus-navidad.jpg',
    'cactus', 30, 40, 'segmentada', 'verde', 'rojo', 'invierno',
    'bien drenado', 'parcial', 'bajo', 15, 25, 'baja',
    'Floración en invierno', 'No tóxico', 'principiante', 20
),
(
    UUID(), 'Begonia Rex', 'Begonia rex', 'Planta de interior con hojas coloridas y patrones únicos.', 1800.00, 'https://example.com/begonia.jpg',
    'interior', 45, 30, 'perenne', 'verde/rojo/plateado', 'blanco/rosa', 'primavera-verano',
    'bien drenado', 'parcial', 'medio', 18, 27, 'alta',
    'Decorativa, Colorida', 'Tóxico para mascotas', 'intermedio', 8
),
(
    UUID(), 'Rosa', 'Rosa sp.', 'Arbusto florido clásico disponible en múltiples colores.', 2000.00, 'https://example.com/rosa.jpg',
    'exterior', 150, 100, 'caduca', 'verde', 'variado', 'primavera-verano',
    'rico en nutrientes', 'pleno', 'medio', 10, 30, 'media',
    'Fragancia, Atrae polinizadores', 'No tóxico', 'experto', 15
),
(
    UUID(), 'Helecho Boston', 'Nephrolepis exaltata', 'Helecho clásico de interior con frondas arqueadas.', 1400.00, 'https://example.com/helecho.jpg',
    'interior', 60, 90, 'fronda', 'verde claro', NULL, NULL,
    'rico en nutrientes', 'sombra', 'alto', 16, 24, 'alta',
    'Purificación del aire, Humidificación natural', 'No tóxico', 'intermedio', 12
),
(
    UUID(), 'Romero', 'Rosmarinus officinalis', 'Hierba aromática perenne con usos culinarios.', 1200.00, 'https://example.com/romero.jpg',
    'aromatica', 80, 60, 'perenne', 'verde grisáceo', 'azul', 'primavera',
    'bien drenado', 'pleno', 'bajo', 8, 30, 'baja',
    'Culinario, Repelente de insectos', 'No tóxico', 'principiante', 25
),
(
    UUID(), 'Suculenta Echeveria', 'Echeveria elegans', 'Suculenta de roseta con hojas carnosas.', 900.00, 'https://example.com/echeveria.jpg',
    'suculenta', 15, 20, 'roseta', 'verde/azul/rosa', 'rojo/naranja', 'primavera',
    'arenoso', 'pleno', 'bajo', 5, 30, 'baja',
    'Decorativa, Bajo mantenimiento', 'No tóxico', 'principiante', 30
); 