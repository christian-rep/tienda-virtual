import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Usuario, UpdateProfileData, ChangePasswordData } from '../../interfaces/user.interface';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: Usuario | null = null;
  error: string | null = null;
  success: string | null = null;
  loading = false;
  passwordLoading = false;
  activeTab: 'profile' | 'password' = 'profile';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: [''],
      direccion: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    console.log('Iniciando componente de perfil...');
    this.currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual del localStorage:', this.currentUser);
    
    if (!this.currentUser) {
      console.log('No hay usuario autenticado, redirigiendo a login...');
      this.router.navigate(['/login']);
      return;
    }

    // Obtener datos completos del usuario desde el servidor
    this.loading = true;
    console.log('Obteniendo datos completos del servidor...');
    
    this.authService.getUserProfile().subscribe({
      next: (userData) => {
        console.log('Datos completos recibidos del servidor:', userData);
        this.currentUser = userData;
        this.loading = false;
        
        // Cargar los datos editables del usuario en el formulario
        const formData = {
          nombre: userData.nombre || '',
          apellido: userData.apellido || '',
          telefono: userData.telefono || '',
          direccion: userData.direccion || ''
        };
        
        console.log('Datos a cargar en el formulario:', formData);
        this.profileForm.patchValue(formData);
        
        console.log('Formulario actualizado:', this.profileForm.value);
      },
      error: (error) => {
        console.error('Error al cargar datos del usuario:', error);
        this.loading = false;
        
        // Si falla, usar los datos del localStorage como respaldo
        const fallbackData = {
          nombre: this.currentUser?.nombre || '',
          apellido: this.currentUser?.apellido || '',
          telefono: this.currentUser?.telefono || '',
          direccion: this.currentUser?.direccion || ''
        };
        
        console.log('Usando datos de respaldo del localStorage:', fallbackData);
        this.profileForm.patchValue(fallbackData);
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmitProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const profileData: UpdateProfileData = {
      nombre: this.profileForm.get('nombre')?.value,
      apellido: this.profileForm.get('apellido')?.value,
      telefono: this.profileForm.get('telefono')?.value || undefined,
      direccion: this.profileForm.get('direccion')?.value || undefined
    };

    this.authService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.loading = false;
        this.currentUser = updatedUser;
        this.success = 'Perfil actualizado exitosamente';
        setTimeout(() => {
          this.success = null;
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.mensaje || 'Error al actualizar el perfil';
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    });
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.passwordLoading = true;
    this.error = null;
    this.success = null;

    const passwordData: ChangePasswordData = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value,
      confirmPassword: this.passwordForm.get('confirmPassword')?.value
    };

    this.authService.changePassword(passwordData.currentPassword, passwordData.newPassword).subscribe({
      next: (response) => {
        this.passwordLoading = false;
        this.success = response.mensaje || 'Contraseña cambiada exitosamente';
        this.passwordForm.reset();
        setTimeout(() => {
          this.success = null;
        }, 3000);
      },
      error: (error) => {
        this.passwordLoading = false;
        this.error = error.error?.mensaje || 'Error al cambiar la contraseña';
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    });
  }

  setActiveTab(tab: 'profile' | 'password'): void {
    this.activeTab = tab;
    this.error = null;
    this.success = null;
  }

  getErrorMessage(controlName: string, form: FormGroup): string {
    const control = form.get(controlName);
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