import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss']
})
export class RecuperarPasswordComponent {
  recuperarForm: FormGroup;
  error: string = '';
  success: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.recuperarForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.recuperarForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      this.authService.recuperarPassword(this.recuperarForm.value.email)
        .subscribe({
          next: (response) => {
            this.success = 'Se han enviado las instrucciones a tu correo electrónico';
            this.loading = false;
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          },
          error: (error) => {
            this.error = error.error.message || 'Error al procesar la solicitud';
            this.loading = false;
          }
        });
    }
  }
} 