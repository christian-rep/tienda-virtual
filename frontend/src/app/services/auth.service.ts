import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../interfaces/user.interface';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  // Agregar el subject para el usuario actual
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Intentar recuperar el usuario del localStorage
    const token = localStorage.getItem('token');
    if (token) {
      this.loadUserFromToken(token);
    }
    
    // Cargar el usuario desde localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error al cargar el usuario desde localStorage:', error);
      }
    }
  }

  private loadUserFromToken(token: string): void {
    // Decodificar el token JWT para obtener la información del usuario
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('user', JSON.stringify(payload.user));
      this.isAuthenticatedSubject.next(true);
      
      // Actualizar el subject del usuario
      if (payload.user) {
        this.currentUserSubject.next(payload.user);
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      this.logout();
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  login(credentials: LoginCredentials): Observable<{ token: string, user: User }> {
    return this.http.post<{ token: string, user: User }>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  register(userData: RegisterData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isAdmin(): boolean {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user) as User;
      return userData.rol === 'admin';
    }
    return false;
  }

  getUserProfile(): Observable<User> {
    const user = localStorage.getItem('user');
    if (user) {
      return of(JSON.parse(user) as User);
    }
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
