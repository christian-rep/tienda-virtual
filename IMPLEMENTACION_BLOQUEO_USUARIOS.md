# Implementación del Sistema de Bloqueo por Intentos Fallidos

## 📋 Resumen de la Funcionalidad

Se ha implementado un sistema de seguridad que bloquea temporalmente las cuentas de usuario después de 5 intentos fallidos de inicio de sesión. El bloqueo dura 15 minutos y es específico por email, permitiendo que otros usuarios continúen accediendo normalmente.

## 🔧 Cambios Realizados

### 1. Base de Datos (Ya Implementado)

**Archivo:** `backupbd.txt` (estructura actualizada)

**Campos Agregados a la tabla `usuarios`:**
```sql
`intentos_fallidos` INT NULL DEFAULT '0',
`bloqueado_hasta` TIMESTAMP NULL DEFAULT NULL,
```

**Índices Creados:**
```sql
INDEX `idx_intentos_fallidos` (`intentos_fallidos` ASC) VISIBLE,
INDEX `idx_bloqueado_hasta` (`bloqueado_hasta` ASC) VISIBLE
```

### 2. Backend - Modelo de Usuario

**Archivo:** `backend/models/usuario.js`

**Métodos Agregados:**
```javascript
// Incrementa el contador de intentos fallidos
static async incrementarIntentosFallidos(email)

// Resetea intentos y desbloquea la cuenta
static async resetearIntentosFallidos(email)

// Bloquea la cuenta por X minutos
static async bloquearUsuario(email, minutosBloqueo = 15)

// Verifica si la cuenta está bloqueada
static async verificarSiEstaBloqueado(email)

// Obtiene el número de intentos fallidos
static async obtenerIntentosFallidos(email)
```

**Cambio en `obtenerPorEmail()`:**
```javascript
// Se agregaron los campos de bloqueo a la consulta
'SELECT id, nombre, apellido, email, password, rol, telefono, direccion, activo, email_verificado, intentos_fallidos, bloqueado_hasta FROM usuarios WHERE email = ?'
```

### 3. Backend - Controlador de Autenticación

**Archivo:** `backend/controllers/authController.js`

**Modificaciones en el método `login()`:**

#### Antes:
```javascript
// Verificar password
const passwordValido = await bcrypt.compare(password, usuario.password);
if (!passwordValido) {
  return res.status(401).json({ mensaje: 'Credenciales inválidas' });
}
```

#### Después:
```javascript
// Verificar si el usuario está bloqueado
const minutosBloqueado = await Usuario.verificarSiEstaBloqueado(email);
if (minutosBloqueado !== null) {
  return res.status(423).json({ 
    mensaje: `Tu cuenta está bloqueada temporalmente. Intenta nuevamente en ${minutosBloqueado} minutos.`,
    bloqueado: true,
    minutosRestantes: minutosBloqueado
  });
}

// Verificar password
const passwordValido = await bcrypt.compare(password, usuario.password);
if (!passwordValido) {
  // Incrementar intentos fallidos
  await Usuario.incrementarIntentosFallidos(email);
  const intentosFallidos = await Usuario.obtenerIntentosFallidos(email);
  
  // Si alcanzó 5 intentos fallidos, bloquear por 15 minutos
  if (intentosFallidos >= 5) {
    await Usuario.bloquearUsuario(email, 15);
    return res.status(423).json({ 
      mensaje: 'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por 15 minutos.',
      bloqueado: true,
      minutosRestantes: 15
    });
  }
  
  // Calcular intentos restantes
  const intentosRestantes = 5 - intentosFallidos;
  return res.status(401).json({ 
    mensaje: `Credenciales inválidas. Te quedan ${intentosRestantes} intentos antes del bloqueo.`,
    intentosRestantes
  });
}

// Si el login es exitoso, resetear intentos fallidos
await Usuario.resetearIntentosFallidos(email);
```

**Nuevos Métodos Agregados:**

```javascript
// Desbloquear cuenta manualmente (solo para administradores)
exports.desbloquearCuenta = async (req, res)

// Obtener información de bloqueo (solo para administradores)
exports.obtenerInfoBloqueo = async (req, res)
```

### 4. Backend - Rutas

**Archivo:** `backend/routes/authRoutes.js`

**Nuevas Rutas Agregadas:**
```javascript
// Rutas para administradores - manejo de bloqueo de cuentas
router.post('/auth/desbloquear-cuenta', verificarToken, authController.desbloquearCuenta);
router.get('/auth/info-bloqueo/:email', verificarToken, authController.obtenerInfoBloqueo);
```

### 5. Frontend - Componente de Login

**Archivo:** `frontend/src/app/pages/login/login.component.ts`

**Nuevas Propiedades Agregadas:**
```typescript
intentosRestantes: number | null = null;
bloqueado: boolean = false;
minutosRestantes: number | null = null;
```

**Modificaciones en `onSubmit()`:**
```typescript
// Reset de variables de bloqueo
this.intentosRestantes = null;
this.bloqueado = false;
this.minutosRestantes = null;

// Manejo de diferentes tipos de errores
if (error.status === 423) {
  // Usuario bloqueado
  this.bloqueado = true;
  this.minutosRestantes = error.error?.minutosRestantes || 15;
  this.error = error.error?.mensaje || 'Tu cuenta está bloqueada temporalmente.';
} else if (error.status === 401) {
  // Credenciales inválidas
  this.intentosRestantes = error.error?.intentosRestantes || null;
  this.error = error.error?.mensaje || 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
}
```

### 6. Frontend - Template HTML

**Archivo:** `frontend/src/app/pages/login/login.component.html`

**Cambios en la Alerta de Error:**
```html
<!-- Antes -->
<div *ngIf="error" class="alert alert-danger">
  {{ error }}
</div>

<!-- Después -->
<div *ngIf="error" class="alert" [ngClass]="{
  'alert-danger': !bloqueado,
  'alert-warning': bloqueado
}">
  <div class="d-flex align-items-center">
    <i *ngIf="bloqueado" class="fas fa-clock me-2"></i>
    <i *ngIf="!bloqueado" class="fas fa-exclamation-triangle me-2"></i>
    <div>
      {{ error }}
      <div *ngIf="intentosRestantes !== null && intentosRestantes > 0" class="mt-1">
        <small class="text-muted">
          <i class="fas fa-info-circle me-1"></i>
          Intentos restantes: {{ intentosRestantes }}
        </small>
      </div>
      <div *ngIf="bloqueado && minutosRestantes !== null" class="mt-1">
        <small class="text-muted">
          <i class="fas fa-hourglass-half me-1"></i>
          Tiempo restante: {{ minutosRestantes }} minutos
        </small>
      </div>
    </div>
  </div>
</div>
```

**Cambios en el Formulario:**
```html
<!-- Campos deshabilitados durante bloqueo -->
<input [disabled]="bloqueado">
<button [disabled]="bloqueado">

<!-- Botón de envío modificado -->
<button [disabled]="loginForm.invalid || loading || bloqueado">
  {{ 
    loading ? 'Iniciando sesión...' : 
    bloqueado ? 'Cuenta bloqueada' : 
    'Iniciar Sesión' 
  }}
</button>
```

## 🚀 Códigos de Estado HTTP

### Nuevos Códigos Utilizados:
- **423 (Locked)**: Cuenta bloqueada temporalmente
- **401 (Unauthorized)**: Credenciales inválidas (con información de intentos restantes)

### Respuestas del Servidor:

**Usuario Bloqueado:**
```json
{
  "mensaje": "Tu cuenta está bloqueada temporalmente. Intenta nuevamente en 8 minutos.",
  "bloqueado": true,
  "minutosRestantes": 8
}
```

**Credenciales Inválidas:**
```json
{
  "mensaje": "Credenciales inválidas. Te quedan 3 intentos antes del bloqueo.",
  "intentosRestantes": 3
}
```

## 🔧 Configuración Personalizable

### Parámetros Ajustables en `backend/controllers/authController.js`:

```javascript
// Número de intentos antes del bloqueo
if (intentosFallidos >= 5) { ... }

// Tiempo de bloqueo en minutos
await Usuario.bloquearUsuario(email, 15);
```

### Valores por Defecto:
- **Intentos máximos**: 5
- **Tiempo de bloqueo**: 15 minutos
- **Bloqueo por**: Email específico

## 👨‍💼 Funcionalidades para Administradores

### Endpoints Disponibles:

**1. Desbloquear Cuenta:**
```http
POST /auth/desbloquear-cuenta
Content-Type: application/json
Authorization: Bearer <token_admin>

{
  "email": "usuario@ejemplo.com"
}
```

**2. Consultar Estado de Bloqueo:**
```http
GET /auth/info-bloqueo/usuario@ejemplo.com
Authorization: Bearer <token_admin>
```

**Respuesta:**
```json
{
  "email": "usuario@ejemplo.com",
  "bloqueado": true,
  "minutosRestantes": 8,
  "intentosFallidos": 5
}
```

## 🔍 Flujo de Funcionamiento

### Escenario 1: Login Fallido
1. Usuario ingresa credenciales incorrectas
2. Sistema incrementa `intentos_fallidos` en +1
3. Si `intentos_fallidos < 5`: Muestra mensaje con intentos restantes
4. Si `intentos_fallidos >= 5`: Bloquea cuenta por 15 minutos

### Escenario 2: Login Exitoso
1. Usuario ingresa credenciales correctas
2. Sistema resetea `intentos_fallidos = 0`
3. Sistema limpia `bloqueado_hasta = NULL`
4. Usuario accede normalmente

### Escenario 3: Usuario Bloqueado
1. Sistema verifica `bloqueado_hasta` en cada intento
2. Si `bloqueado_hasta > NOW()`: Mantiene bloqueo
3. Si `bloqueado_hasta <= NOW()`: Desbloquea automáticamente

## 🛠️ Verificación de Implementación

### Pasos para Verificar:

1. **Verificar Base de Datos:**
   ```sql
   DESCRIBE usuarios;
   -- Debe mostrar: intentos_fallidos, bloqueado_hasta
   ```

2. **Verificar Servidor:**
   ```bash
   cd backend
   node server.js
   ```

3. **Probar Funcionalidad:**
   - Intentar login con credenciales incorrectas 5 veces
   - Verificar que se bloquee la cuenta
   - Esperar 15 minutos o usar endpoint de admin para desbloquear

4. **Verificar Frontend:**
   - Los mensajes de error deben mostrar intentos restantes
   - El formulario debe deshabilitarse durante bloqueo
   - Los iconos y colores deben cambiar según el estado

## 📝 Notas Importantes

### Seguridad:
- ✅ Bloqueo específico por email (no afecta otros usuarios)
- ✅ Desbloqueo automático después del tiempo establecido
- ✅ Reset automático de intentos con login exitoso
- ⚠️ El bloqueo es por email, no por IP

### Mantenimiento:
- Los intentos se resetean automáticamente
- No requiere limpieza manual de datos
- Los índices mejoran el rendimiento de consultas

### Compatibilidad:
- Funciona con la estructura existente de la base de datos
- No afecta funcionalidades existentes
- Compatible con el sistema de autenticación actual

## 🔧 Troubleshooting

### Problemas Comunes:

1. **No se incrementan los intentos:**
   - Verificar que el método `incrementarIntentosFallidos()` se ejecute
   - Revisar logs del servidor

2. **No se bloquea la cuenta:**
   - Verificar que `intentos_fallidos >= 5`
   - Revisar que el método `bloquearUsuario()` funcione

3. **No se desbloquea automáticamente:**
   - Verificar que `verificarSiEstaBloqueado()` compare fechas correctamente
   - Revisar zona horaria del servidor

4. **Frontend no muestra mensajes:**
   - Verificar que el componente maneje status 423
   - Revisar que las propiedades se actualicen correctamente

### Debug:
```javascript
// Agregar logs en authController.js
console.log('Intentos fallidos:', intentosFallidos);
console.log('Minutos bloqueado:', minutosBloqueado);
``` 