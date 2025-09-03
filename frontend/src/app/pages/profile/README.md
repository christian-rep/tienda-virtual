# Componente de Perfil de Usuario

## Descripción
Este componente permite a los usuarios autenticados modificar sus datos personales y cambiar su contraseña.

## Funcionalidades

### 1. Actualización de Datos Personales
- **Nombre**: Campo obligatorio, mínimo 2 caracteres
- **Apellido**: Campo obligatorio, mínimo 2 caracteres  
- **Teléfono**: Campo opcional
- **Dirección**: Campo opcional

### 2. Cambio de Contraseña
- **Contraseña Actual**: Campo obligatorio para verificar identidad
- **Nueva Contraseña**: Campo obligatorio, mínimo 6 caracteres
- **Confirmar Nueva Contraseña**: Campo obligatorio, debe coincidir con la nueva contraseña

### 3. Información de la Cuenta
Muestra información de solo lectura:
- Email del usuario
- Rol (Usuario/Administrador)
- Estado de la cuenta (Activo/Inactivo)

## Características Técnicas

### Componente Standalone
El componente está configurado como standalone, importando directamente los módulos necesarios:
- `CommonModule`
- `FormsModule`
- `ReactiveFormsModule`

### Validaciones
- **Formulario de Perfil**: Validaciones de longitud mínima para nombre y apellido
- **Formulario de Contraseña**: Validación de coincidencia entre nueva contraseña y confirmación
- **Validación en Tiempo Real**: Los errores se muestran cuando el usuario interactúa con los campos

### Integración con Backend
- **Actualización de Perfil**: Endpoint `PUT /auth/perfil`
- **Cambio de Contraseña**: Endpoint `PUT /auth/cambiar-password`
- **Autenticación**: Requiere token JWT válido

### Interfaz de Usuario
- **Diseño Responsive**: Adaptable a diferentes tamaños de pantalla
- **Pestañas**: Separación clara entre datos personales y cambio de contraseña
- **Feedback Visual**: Alertas de éxito y error
- **Estados de Carga**: Indicadores visuales durante las operaciones

## Uso

### Acceso
El componente está disponible en la ruta `/profile` y requiere autenticación.

### Navegación
Los usuarios pueden acceder desde el menú desplegable en la barra de navegación:
1. Hacer clic en el nombre del usuario
2. Seleccionar "Mi Perfil"

### Flujo de Uso
1. **Actualizar Datos Personales**:
   - Modificar los campos deseados
   - Hacer clic en "Actualizar Perfil"
   - Recibir confirmación de éxito

2. **Cambiar Contraseña**:
   - Cambiar a la pestaña "Cambiar Contraseña"
   - Ingresar contraseña actual
   - Ingresar nueva contraseña y confirmación
   - Hacer clic en "Cambiar Contraseña"
   - Recibir confirmación de éxito

## Archivos del Componente

- `profile.component.ts`: Lógica del componente
- `profile.component.html`: Template HTML
- `profile.component.scss`: Estilos CSS
- `profile.component.spec.ts`: Pruebas unitarias

## Dependencias

### Frontend
- Angular Reactive Forms
- Angular Router
- AuthService (servicio de autenticación)

### Backend
- Endpoint de actualización de perfil
- Endpoint de cambio de contraseña
- Middleware de autenticación JWT

## Seguridad
- Validación de contraseña actual antes de permitir cambios
- Autenticación requerida para todas las operaciones
- Validación de datos en frontend y backend
- Encriptación de contraseñas con bcrypt 