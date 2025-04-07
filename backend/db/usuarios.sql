-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Insertar un usuario administrador por defecto (password: admin123)
INSERT INTO usuarios (nombre, email, password, rol)
VALUES (
  'Administrador', 
  'admin@example.com', 
  '$2a$10$X7UrE2JqJ9QZ9QZ9QZ9QZ.9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ', 
  'admin'
)
ON DUPLICATE KEY UPDATE id=id; 