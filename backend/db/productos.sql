CREATE TABLE IF NOT EXISTS productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    nombre_cientifico VARCHAR(100),
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    nivel_dificultad ENUM('facil', 'medio', 'dificil') DEFAULT 'medio',
    stock INT NOT NULL DEFAULT 0,
    imagen_principal VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos_categorias (
    producto_id INT,
    categoria_id INT,
    PRIMARY KEY (producto_id, categoria_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS productos_toxicidades (
    producto_id INT,
    toxicidad_id INT,
    nivel ENUM('no_toxica', 'leve', 'moderada', 'alta') DEFAULT 'no_toxica',
    descripcion TEXT,
    detalles TEXT,
    PRIMARY KEY (producto_id, toxicidad_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (toxicidad_id) REFERENCES toxicidades(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_producto_nombre ON productos(nombre);
CREATE INDEX idx_producto_precio ON productos(precio);
CREATE INDEX idx_producto_stock ON productos(stock);
CREATE INDEX idx_producto_activo ON productos(activo); 