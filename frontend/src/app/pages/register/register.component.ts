import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterData } from '../../interfaces/user.interface';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string | null = null;
  success: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { mismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      console.log('Formulario inválido:', this.registerForm.errors);
      console.log('Errores de campos:', this.registerForm.get('nombre')?.errors);
      console.log('Errores de campos:', this.registerForm.get('apellido')?.errors);
      console.log('Errores de campos:', this.registerForm.get('email')?.errors);
      console.log('Errores de campos:', this.registerForm.get('password')?.errors);
      console.log('Errores de campos:', this.registerForm.get('confirmPassword')?.errors);
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const userData: RegisterData = {
      nombre: this.registerForm.get('nombre')?.value,
      apellido: this.registerForm.get('apellido')?.value,
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value
    };

    console.log('Enviando datos de registro:', userData);

    this.authService.register(userData).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = response.mensaje || 'Registro exitoso. Por favor, verifica tu email.';
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { message: this.success }
          });
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en registro:', error);
        this.error = error.error?.mensaje || 'Error al registrar usuario';
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
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
      if (control.errors['mismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }
}
