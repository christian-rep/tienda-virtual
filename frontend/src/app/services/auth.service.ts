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
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Verificar el token al iniciar
    this.checkToken();
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
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
          if (payload.user) {
            this.currentUserSubject.next(payload.user);
          }
        } else {
          this.logout();
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
        this.logout();
      }
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.handleAuthResponse(response);
        })
      );
  }

  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          this.handleAuthResponse(response);
        })
      );
  }

  private handleAuthResponse(response: AuthResponse): void {
    if (response.token && response.user) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(response.user);
    }
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
    const user = this.currentUserSubject.value;
    return user?.rol === 'admin';
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

  verifyEmail(token: string): Observable<{ success: boolean; message: string }> {
    return this.http.get<{ success: boolean; message: string }>(
      `${this.apiUrl}/verify-email?token=${token}`
    );
  }
}
