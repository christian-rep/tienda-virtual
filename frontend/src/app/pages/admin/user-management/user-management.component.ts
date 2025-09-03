import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Usuario } from '../../../interfaces/user.interface';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class UserManagementComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuarioSeleccionado: Usuario | null = null;
  usuarioForm: FormGroup;
  modoEdicion: 'crear' | 'editar' | null = null;
  loading: boolean = true;
  error: string = '';

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rol: ['cliente', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.authService.getUsers().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.error = 'No se pudieron cargar los usuarios. Por favor, intente más tarde.';
        this.loading = false;
      }
    });
  }

  nuevoUsuario(): void {
    this.usuarioForm.reset({
      nombre: '',
      apellido: '',
      email: '',
      rol: 'cliente',
      activo: true
    });

    this.usuarioSeleccionado = null;
    this.modoEdicion = 'crear';
  }

  editarUsuario(usuario: Usuario): void {
    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo
    });

    this.usuarioSeleccionado = usuario;
    this.modoEdicion = 'editar';
  }

  cancelarEdicion(): void {
    this.usuarioSeleccionado = null;
    this.modoEdicion = null;
    this.usuarioForm.reset();
    this.error = '';
  }

  guardarUsuario(): void {
    if (this.usuarioForm.valid) {
      const formData = this.usuarioForm.value;

      if (this.usuarioSeleccionado) {
        // Actualizar usuario existente
        this.authService.updateUser(this.usuarioSeleccionado.id, formData).subscribe({
          next: () => {
            this.mostrarMensaje('Usuario actualizado exitosamente');
            this.cargarUsuarios();
            this.cancelarEdicion();
          },
          error: (error) => {
            console.error('Error al actualizar usuario:', error);
            this.mostrarMensaje('Error al actualizar el usuario', true);
          }
        });
      } else {
        // Crear nuevo usuario
        this.authService.createUser(formData).subscribe({
          next: () => {
            this.mostrarMensaje('Usuario creado exitosamente');
            this.cargarUsuarios();
            this.cancelarEdicion();
          },
          error: (error) => {
            console.error('Error al crear usuario:', error);
            this.mostrarMensaje('Error al crear el usuario', true);
          }
        });
      }
    } else {
      this.usuarioForm.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos requeridos', true);
    }
  }

  eliminarUsuario(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      this.authService.deleteUser(id).subscribe({
        next: () => {
          this.mostrarMensaje('Usuario eliminado exitosamente');
          this.cargarUsuarios();
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.mostrarMensaje('Error al eliminar el usuario', true);
        }
      });
    }
  }

  private mostrarMensaje(mensaje: string, esError: boolean = false): void {
    if (esError) {
      console.error(mensaje);
      this.error = mensaje;
    } else {
      console.log(mensaje);
      this.error = '';
    }
  }
} 