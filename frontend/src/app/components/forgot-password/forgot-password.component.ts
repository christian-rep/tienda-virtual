import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      
      this.authService.recuperarPassword(this.forgotPasswordForm.value.email)
        .subscribe({
          next: () => {
            this.router.navigate(['/login'], {
              queryParams: { message: 'Se han enviado las instrucciones a tu correo electrónico' }
            });
          },
          error: (error) => {
            this.errorMessage = 'Error al solicitar el restablecimiento de contraseña. Por favor, intente nuevamente.';
            this.loading = false;
          }
        });
    }
  }
} 
 