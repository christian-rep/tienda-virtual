export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    email_verificado: boolean;
    token_verificacion?: string | null;
    token_reset_password?: string | null;
    fecha_expiracion_token?: string | null;
    fecha_expiracion_reset?: string | null;
    fecha_ultimo_reset?: string | null;
    password: string;
    rol: 'admin' | 'cliente';
    created_at?: string | null;
    telefono: string | null;
    direccion: string | null;
    activo: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    telefono?: string;
    direccion?: string;
}

export interface LoginResponse {
    token: string;
    usuario: Usuario;
    mensaje?: string;
}

export interface UpdateProfileData {
    nombre: string;
    apellido: string;
    telefono?: string;
    direccion?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
} 