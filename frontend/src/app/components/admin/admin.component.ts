import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'cliente';
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  created_at?: string | null;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuarioSeleccionado: Usuario | null = null;
  modoEdicion = false;
  error: string = '';
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  cargarUsuarios() {
    this.loading = true;
    this.error = '';
    
    this.http.get<Usuario[]>(`${environment.apiUrl}/admin/usuarios`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.loading = false;
        
        if (error.status === 401) {
          this.error = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          this.error = 'No tienes permisos para acceder a esta sección';
          this.router.navigate(['/login']);
        } else {
          this.error = 'Error al cargar usuarios. Por favor, intenta nuevamente.';
        }
      }
    });
  }

  editarUsuario(usuario: Usuario) {
    this.usuarioSeleccionado = { ...usuario };
    this.modoEdicion = true;
  }

  guardarUsuario() {
    if (!this.usuarioSeleccionado) return;

    this.loading = true;
    this.error = '';

    this.http.put(
      `${environment.apiUrl}/admin/usuarios/${this.usuarioSeleccionado.id}`,
      this.usuarioSeleccionado,
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.modoEdicion = false;
        this.usuarioSeleccionado = null;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        this.loading = false;
        this.error = 'Error al actualizar usuario. Por favor, intenta nuevamente.';
      }
    });
  }

  eliminarUsuario(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    this.loading = true;
    this.error = '';

    this.http.delete(
      `${environment.apiUrl}/admin/usuarios/${id}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        this.loading = false;
        this.error = 'Error al eliminar usuario. Por favor, intenta nuevamente.';
      }
    });
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
  }
} 