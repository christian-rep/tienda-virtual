import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VerifyEmailComponent implements OnInit {
  message: string = 'Verificando email...';
  error: string | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.error = 'Token de verificación no proporcionado';
      this.loading = false;
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.loading = false;
        this.message = response.message;
        
        // Limpieza mínima de sesión local (sin llamar a logout en backend)
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { message: 'Email verificado correctamente. Por favor inicia sesión.' }
          });
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Error al verificar el email';
      }
    });
  }
}