import { Injectable } from '@angular/core';
import { HttpClient, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Usuario, LoginCredentials, RegisterData, LoginResponse } from '../interfaces/user.interface';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return next.handle(request);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Verificar el token al iniciar
    this.checkToken();
  }

  private getStoredUser(): Usuario | null {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as Usuario;
        this.isAuthenticatedSubject.next(true);
        return user;
      } catch (error) {
        console.error('Error al parsear usuario almacenado:', error);
        return null;
      }
    }
    return null;
  }

  private checkToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          this.isAuthenticatedSubject.next(true);
          if (payload.usuario) {
            this.currentUserSubject.next(payload.usuario);
          }
        } else {
          this.logout();
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
        this.logout();
      }
    } else {
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.token && response.usuario) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/registro`, userData).pipe(
      tap(response => {
        if (response.token && response.usuario) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
        }
      }),
      catchError(error => {
        console.error('Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.rol === 'admin';
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  getUserProfile(): Observable<Usuario> {
    return this.http.get<{ usuario: Usuario }>(`${this.apiUrl}/auth/perfil`).pipe(
      map(response => response.usuario),
      tap(user => {
        // Actualizar el usuario en el localStorage y en el BehaviorSubject
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        console.log('Perfil del usuario obtenido:', user);
      }),
      catchError(error => {
        console.error('Error al obtener perfil del usuario:', error);
        return throwError(() => error);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  verifyEmail(token: string): Observable<{ mensaje: string }> {
    return this.http.get<{ mensaje: string }>(
      `${this.apiUrl}/auth/verificar-email?token=${token}`
    );
  }

  recuperarPassword(email: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/auth/recuperar-password`, { email })
      .pipe(
        catchError(this.handleError)
      );
  }

  resetPassword(token: string, newPassword: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      password: newPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en la petición:', error);
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Error ${error.status}: ${error.error?.mensaje || error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Métodos para la gestión de usuarios
  getUsers(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`).pipe(
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => error);
      })
    );
  }

  createUser(userData: Omit<Usuario, 'id'>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, userData).pipe(
      catchError(error => {
        console.error('Error al crear usuario:', error);
        return throwError(() => error);
      })
    );
  }

  updateUser(id: string, userData: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${id}`, userData).pipe(
      catchError(error => {
        console.error('Error al actualizar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuarios/${id}`).pipe(
      catchError(error => {
        console.error('Error al eliminar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  // Método para actualizar el perfil del usuario actual
  updateProfile(userData: Partial<Usuario>): Observable<Usuario> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.put<{ mensaje: string; usuario: Usuario }>(`${this.apiUrl}/auth/perfil`, userData).pipe(
      tap(response => {
        // Actualizar el usuario en el localStorage y en el BehaviorSubject
        localStorage.setItem('currentUser', JSON.stringify(response.usuario));
        this.currentUserSubject.next(response.usuario);
      }),
      map(response => response.usuario),
      catchError(error => {
        console.error('Error al actualizar perfil:', error);
        return throwError(() => error);
      })
    );
  }

  // Método para cambiar la contraseña del usuario actual
  changePassword(currentPassword: string, newPassword: string): Observable<{ mensaje: string }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/auth/cambiar-password`, {
      passwordActual: currentPassword,
      passwordNuevo: newPassword
    }).pipe(
      catchError(error => {
        console.error('Error al cambiar contraseña:', error);
        return throwError(() => error);
      })
    );
  }
}
