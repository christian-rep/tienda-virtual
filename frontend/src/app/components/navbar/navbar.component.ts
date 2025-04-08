import { Component, OnInit, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule]
})
export class NavbarComponent implements OnInit {
  isAuthenticated = false;
  userName: string = '';
  mobileMenuOpen: boolean = false;
  userMenuOpen: boolean = false;
  cartItemCount: number = 0;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios en el estado de autenticación
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      if (user) {
        this.userName = `${user.nombre} ${user.apellido}`;
      } else {
        this.userName = '';
      }
    });
    
    // Suscribirse a los cambios en el carrito
    this.cartService.getCart().subscribe(cart => {
      this.cartItemCount = cart.reduce((total, item) => total + 1, 0);
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    // Cerrar el menú de usuario si está abierto
    if (this.mobileMenuOpen) {
      this.userMenuOpen = false;
    }
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    // Cerrar menús
    this.mobileMenuOpen = false;
    this.userMenuOpen = false;
  }
  
  // Cerrar el menú desplegable al hacer clic fuera de él
  @HostListener('document:click', ['$event'])
  clickOutside(event: any): void {
    const userMenu = document.querySelector('.user-menu');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    // Si hay un menú de usuario y el clic fue fuera del menú, cerrarlo
    if (userMenu && !userMenu.contains(event.target) && this.userMenuOpen) {
      this.userMenuOpen = false;
    }
    
    // Si el menú móvil está abierto y se hace clic fuera del botón del menú y del menú, cerrarlo
    if (this.mobileMenuOpen && mobileMenuBtn && 
        !mobileMenuBtn.contains(event.target) && 
        !document.querySelector('.navbar-menu')?.contains(event.target) &&
        !document.querySelector('.navbar-end')?.contains(event.target)) {
      this.mobileMenuOpen = false;
    }
  }
}
