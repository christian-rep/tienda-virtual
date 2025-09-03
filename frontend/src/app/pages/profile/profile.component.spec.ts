import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../interfaces/user.interface';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser: Usuario = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com',
    rol: 'user',
    telefono: '123456789',
    direccion: 'Calle 123',
    activo: true
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getCurrentUser', 
      'updateProfile', 
      'changePassword'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data on init', () => {
    authService.getCurrentUser.and.returnValue(mockUser);
    
    fixture.detectChanges();
    
    expect(component.currentUser).toEqual(mockUser);
    expect(component.profileForm.get('nombre')?.value).toBe(mockUser.nombre);
    expect(component.profileForm.get('apellido')?.value).toBe(mockUser.apellido);
    expect(component.profileForm.get('telefono')?.value).toBe(mockUser.telefono);
    expect(component.profileForm.get('direccion')?.value).toBe(mockUser.direccion);
  });

  it('should navigate to login if no user is authenticated', () => {
    authService.getCurrentUser.and.returnValue(null);
    
    fixture.detectChanges();
    
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should update profile successfully', () => {
    authService.getCurrentUser.and.returnValue(mockUser);
    authService.updateProfile.and.returnValue(of(mockUser));
    
    fixture.detectChanges();
    
    const updatedUser = { ...mockUser, nombre: 'Pedro' };
    component.profileForm.patchValue({ nombre: 'Pedro' });
    
    component.onSubmitProfile();
    
    expect(authService.updateProfile).toHaveBeenCalledWith({
      nombre: 'Pedro',
      apellido: mockUser.apellido,
      telefono: mockUser.telefono,
      direccion: mockUser.direccion
    });
    expect(component.success).toBe('Perfil actualizado exitosamente');
  });

  it('should handle profile update error', () => {
    authService.getCurrentUser.and.returnValue(mockUser);
    authService.updateProfile.and.returnValue(throwError(() => ({ 
      error: { mensaje: 'Error de servidor' } 
    })));
    
    fixture.detectChanges();
    
    component.onSubmitProfile();
    
    expect(component.error).toBe('Error de servidor');
  });

  it('should change password successfully', () => {
    authService.getCurrentUser.and.returnValue(mockUser);
    authService.changePassword.and.returnValue(of({ mensaje: 'Contraseña cambiada' }));
    
    fixture.detectChanges();
    
    component.passwordForm.patchValue({
      currentPassword: 'oldpass',
      newPassword: 'newpass',
      confirmPassword: 'newpass'
    });
    
    component.onSubmitPassword();
    
    expect(authService.changePassword).toHaveBeenCalledWith('oldpass', 'newpass');
    expect(component.success).toBe('Contraseña cambiada');
  });

  it('should handle password change error', () => {
    authService.getCurrentUser.and.returnValue(mockUser);
    authService.changePassword.and.returnValue(throwError(() => ({ 
      error: { mensaje: 'Contraseña incorrecta' } 
    })));
    
    fixture.detectChanges();
    
    component.passwordForm.patchValue({
      currentPassword: 'wrongpass',
      newPassword: 'newpass',
      confirmPassword: 'newpass'
    });
    
    component.onSubmitPassword();
    
    expect(component.error).toBe('Contraseña incorrecta');
  });

  it('should validate password match', () => {
    authService.getCurrentUser.and.returnValue(mockUser);
    
    fixture.detectChanges();
    
    component.passwordForm.patchValue({
      currentPassword: 'oldpass',
      newPassword: 'newpass',
      confirmPassword: 'differentpass'
    });
    
    expect(component.passwordForm.hasError('mismatch')).toBe(true);
  });

  it('should switch between tabs', () => {
    authService.getCurrentUser.and.returnValue(mockUser);
    
    fixture.detectChanges();
    
    expect(component.activeTab).toBe('profile');
    
    component.setActiveTab('password');
    expect(component.activeTab).toBe('password');
    
    component.setActiveTab('profile');
    expect(component.activeTab).toBe('profile');
  });

  it('should clear messages when switching tabs', () => {
    authService.getCurrentUser.and.returnValue(mockUser);
    
    fixture.detectChanges();
    
    component.error = 'Error message';
    component.success = 'Success message';
    
    component.setActiveTab('password');
    
    expect(component.error).toBeNull();
    expect(component.success).toBeNull();
  });
}); 