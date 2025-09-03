# Sistema de Bloqueo por Intentos Fallidos de Login

## Descripción

Este sistema implementa un mecanismo de seguridad que bloquea temporalmente las cuentas de usuario después de múltiples intentos fallidos de inicio de sesión. El bloqueo es específico por email, lo que significa que otros usuarios con emails diferentes pueden seguir accediendo normalmente.

## Características

### 🔒 Bloqueo Automático
- **5 intentos fallidos** antes del bloqueo
- **15 minutos** de bloqueo temporal
- **Bloqueo por email específico** (otros usuarios no se ven afectados)

### 🔄 Gestión Automática
- Los intentos se resetean automáticamente después de un login exitoso
- El bloqueo se desactiva automáticamente después del tiempo establecido
- No requiere intervención manual

### 👨‍💼 Panel de Administración
- Los administradores pueden desbloquear cuentas manualmente
- Consulta de información de bloqueo por email
- Endpoints protegidos solo para administradores

## Implementación Técnica

### Base de Datos

Se agregaron los siguientes campos a la tabla `usuarios`:

```sql
ALTER TABLE usuarios 
ADD COLUMN intentos_fallidos INT DEFAULT 0,
ADD COLUMN bloqueado_hasta TIMESTAMP NULL;
```

### Backend

#### Modelo de Usuario (`backend/models/usuario.js`)
- `incrementarIntentosFallidos(email)`: Incrementa el contador de intentos fallidos
- `resetearIntentosFallidos(email)`: Resetea intentos y desbloquea la cuenta
- `bloquearUsuario(email, minutosBloqueo)`: Bloquea la cuenta por X minutos
- `verificarSiEstaBloqueado(email)`: Verifica si la cuenta está bloqueada
- `obtenerIntentosFallidos(email)`: Obtiene el número de intentos fallidos

#### Controlador de Autenticación (`backend/controllers/authController.js`)
- **Login modificado**: Implementa la lógica de bloqueo
- **Desbloqueo manual**: Endpoint para administradores
- **Consulta de estado**: Información de bloqueo por email

#### Nuevos Endpoints
```
POST /auth/desbloquear-cuenta    # Desbloquear cuenta (solo admin)
GET  /auth/info-bloqueo/:email   # Info de bloqueo (solo admin)
```

### Frontend

#### Componente de Login (`frontend/src/app/pages/login/login.component.ts`)
- Manejo de diferentes tipos de errores (401, 423)
- Visualización de intentos restantes
- Indicadores de bloqueo temporal
- Deshabilitación de formulario durante bloqueo

#### Template HTML
- Alertas diferenciadas por tipo de error
- Contador de intentos restantes
- Indicador de tiempo de bloqueo
- Iconos visuales para mejor UX

## Flujo de Funcionamiento

### 1. Intento de Login Fallido
```
Usuario ingresa credenciales incorrectas
↓
Sistema incrementa contador de intentos fallidos
↓
Si intentos < 5: Muestra mensaje con intentos restantes
Si intentos >= 5: Bloquea cuenta por 15 minutos
```

### 2. Login Exitoso
```
Usuario ingresa credenciales correctas
↓
Sistema resetea contador de intentos fallidos
↓
Usuario accede normalmente
```

### 3. Bloqueo Temporal
```
Cuenta bloqueada después de 5 intentos fallidos
↓
Sistema bloquea por 15 minutos
↓
Después de 15 minutos: Desbloqueo automático
```

## Instalación

### 1. Ejecutar Migración
```sql
-- Ejecutar el script de migración
source backend/database/migration_add_login_blocking.sql
```

### 2. Reiniciar Servicios
```bash
# Backend
npm run dev

# Frontend
ng serve
```

## Uso para Administradores

### Desbloquear Cuenta Manualmente
```javascript
// POST /auth/desbloquear-cuenta
{
  "email": "usuario@ejemplo.com"
}
```

### Consultar Estado de Bloqueo
```javascript
// GET /auth/info-bloqueo/usuario@ejemplo.com
{
  "email": "usuario@ejemplo.com",
  "bloqueado": true,
  "minutosRestantes": 8,
  "intentosFallidos": 5
}
```

## Configuración

### Parámetros Ajustables

En `backend/controllers/authController.js`:

```javascript
// Número de intentos antes del bloqueo
if (intentosFallidos >= 5) { ... }

// Tiempo de bloqueo en minutos
await Usuario.bloquearUsuario(email, 15);
```

### Personalización

Puedes ajustar:
- **Número de intentos**: Cambiar el valor `5` por el deseado
- **Tiempo de bloqueo**: Modificar el valor `15` (minutos)
- **Mensajes**: Personalizar los mensajes de error

## Seguridad

### Ventajas
- ✅ Previene ataques de fuerza bruta
- ✅ Bloqueo específico por usuario
- ✅ Desbloqueo automático
- ✅ No afecta a otros usuarios
- ✅ Logs de intentos fallidos

### Consideraciones
- ⚠️ El bloqueo es por email, no por IP
- ⚠️ Los intentos se resetean con login exitoso
- ⚠️ Tiempo de bloqueo fijo (no progresivo)

## Monitoreo

### Logs Recomendados
- Intentos fallidos por email
- Bloqueos activados
- Desbloqueos automáticos
- Desbloqueos manuales por administradores

### Métricas Útiles
- Número de cuentas bloqueadas
- Intentos fallidos promedio
- Tiempo promedio de bloqueo
- Intentos de acceso durante bloqueo

## Troubleshooting

### Problemas Comunes

1. **Cuenta no se desbloquea automáticamente**
   - Verificar que el servidor esté ejecutándose
   - Revisar logs de errores en la base de datos

2. **Contador de intentos no se resetea**
   - Verificar que el login sea exitoso
   - Revisar logs de la función `resetearIntentosFallidos`

3. **Error 423 no se maneja en frontend**
   - Verificar que el componente maneje el status 423
   - Revisar la lógica de manejo de errores

### Debug

Para debuggear, puedes agregar logs en:
- `Usuario.incrementarIntentosFallidos()`
- `Usuario.verificarSiEstaBloqueado()`
- `authController.login()`

## Futuras Mejoras

### Posibles Extensiones
- Bloqueo progresivo (tiempo aumenta con cada bloqueo)
- Bloqueo por IP además de por email
- Notificaciones por email al usuario bloqueado
- Dashboard de administración para gestión de bloqueos
- Whitelist de IPs para evitar bloqueos
- Logs detallados de intentos de acceso 