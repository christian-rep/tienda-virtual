import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isAdmin = false;
  userName = '';
  mobileMenuOpen = false;
  userMenuOpen = false;
  cartItemCount = 0;
  private cartSubscription: Subscription | undefined;
  private authSubscription: Subscription | undefined;
  private userSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios de autenticación
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.userSubscription = this.authService.currentUser$.subscribe(user => {
          if (user) {
            this.userName = user.nombre;
            this.isAdmin = user.rol === 'admin';
          } else {
            this.userName = '';
            this.isAdmin = false;
          }
        });
      } else {
        this.userName = '';
        this.isAdmin = false;
      }
    });

    // Suscribirse a los cambios del carrito
    this.cartSubscription = this.cartService.cartItemCount$.subscribe((count: number) => {
      this.cartItemCount = count;
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleMobileMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.mobileMenuOpen = !this.mobileMenuOpen;
    // Cerrar el menú de usuario si está abierto
    if (this.mobileMenuOpen) {
      this.userMenuOpen = false;
    }
  }

  toggleUserMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.authService.logout();
    this.router.navigate(['/login']);
    // Cerrar menús
    this.mobileMenuOpen = false;
    this.userMenuOpen = false;
  }

  navigateTo(route: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate([route]);
    this.userMenuOpen = false;
    this.mobileMenuOpen = false;
  }

  navigateToUserManagement(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isAdmin) {
      this.router.navigate(['/admin/usuarios']);
      this.userMenuOpen = false;
      this.mobileMenuOpen = false;
    }
  }
  
  // Cerrar el menú desplegable al hacer clic fuera de él
  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent): void {
    const userMenu = document.querySelector('.user-menu');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    // Si hay un menú de usuario y el clic fue fuera del menú, cerrarlo
    if (userMenu && !userMenu.contains(event.target as Node) && this.userMenuOpen) {
      this.userMenuOpen = false;
    }
    
    // Si el menú móvil está abierto y se hace clic fuera del botón del menú y del menú, cerrarlo
    if (this.mobileMenuOpen && mobileMenuBtn && 
        !mobileMenuBtn.contains(event.target as Node) && 
        !document.querySelector('.navbar-menu')?.contains(event.target as Node) &&
        !document.querySelector('.navbar-end')?.contains(event.target as Node)) {
      this.mobileMenuOpen = false;
    }
  }
}
