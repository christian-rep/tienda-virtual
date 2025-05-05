export interface User {
    id: string;
    email: string;
    nombre: string;
    apellido?: string;
    rol: 'user' | 'admin';
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData extends LoginCredentials {
    nombre: string;
    apellido?: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: User;
    message?: string;
} 