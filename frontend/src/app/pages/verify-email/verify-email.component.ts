import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class VerifyEmailComponent implements OnInit {
  message: string = '';
  error: string | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.error = 'Token de verificación no proporcionado';
      this.loading = false;
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.loading = false;
        this.message = response.mensaje;
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { message: 'Email verificado exitosamente. Por favor, inicia sesión.' }
          });
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.mensaje || 'Error al verificar el email';
      }
    });
  }
}