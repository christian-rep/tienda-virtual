import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials } from '../../interfaces/user.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error: string | null = null;  
  success: string | null = null;
  loading = false;
  returnUrl: string = '/';
  intentosRestantes: number | null = null;
  bloqueado: boolean = false;
  minutosRestantes: number | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Obtener la URL de retorno de los parámetros de consulta
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Verificar si hay un mensaje de éxito en los queryParams
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.success = params['message'];
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    this.intentosRestantes = null;
    this.bloqueado = false;
    this.minutosRestantes = null;

    const credentials: LoginCredentials = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.usuario.rol === 'admin') {
          this.router.navigate(['/admin/usuarios']);
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en login:', error);
        
        // Manejar diferentes tipos de errores
        if (error.status === 423) {
          // Usuario bloqueado
          this.bloqueado = true;
          this.minutosRestantes = error.error?.minutosRestantes || 15;
          this.error = error.error?.mensaje || 'Tu cuenta está bloqueada temporalmente.';
        } else if (error.status === 401) {
          // Credenciales inválidas
          this.intentosRestantes = error.error?.intentosRestantes || null;
          this.error = error.error?.mensaje || 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
        } else {
          // Otros errores
          this.error = error.error?.mensaje || 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
        }
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (control.errors['email']) {
        return 'Por favor, ingrese un email válido';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  irARecuperarPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
