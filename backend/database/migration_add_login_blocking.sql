-- Migración para agregar sistema de bloqueo por intentos fallidos de login
-- Ejecutar este script en la base de datos existente

USE tienda_bd;

-- Agregar campos para el sistema de bloqueo
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS intentos_fallidos INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP NULL;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_intentos_fallidos ON usuarios(intentos_fallidos);
CREATE INDEX IF NOT EXISTS idx_bloqueado_hasta ON usuarios(bloqueado_hasta);

-- Comentario sobre la funcionalidad
-- Este sistema bloquea temporalmente las cuentas después de 5 intentos fallidos de login
-- El bloqueo dura 15 minutos por defecto
-- Los intentos se resetean automáticamente después de un login exitoso 