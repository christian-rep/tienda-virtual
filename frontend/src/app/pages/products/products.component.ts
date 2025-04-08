import { Component, OnInit } from '@angular/core';
import { ProductsService } from '../../services/products.service';
import { CartService } from '../../services/cart.service';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Product } from '../../interfaces/product.interface';

interface Filtros {
  tipoPlanta: string;
  nivelLuz: string;
  nivelDificultad: string;
  frecuenciaRiego: string;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  imports: [NgFor, NgIf, NgClass, FormsModule],
  standalone: true
})
export class ProductsComponent implements OnInit {
  productos: Product[] = [];
  productosFiltrados: Product[] = [];
  error: string = '';
  loading: boolean = true;
  
  filtros: Filtros = {
    tipoPlanta: '',
    nivelLuz: '',
    nivelDificultad: '',
    frecuenciaRiego: ''
  };

  constructor(
    private productsService: ProductsService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Primero cargar todos los productos
    this.loadProducts();
    
    // Luego verificar si hay parámetros de consulta (filtros desde la URL)
    this.route.queryParams.subscribe(params => {
      if (params['tipoPlanta']) {
        this.filtros.tipoPlanta = params['tipoPlanta'];
        // Aplicar el filtro después de cargar los productos
        this.aplicarFiltrosDesdeURL();
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productsService.getProducts().subscribe({
      next: (data) => {
        console.log("Plantas obtenidas:", data);
        this.productos = data;
        this.productosFiltrados = [...this.productos];
        this.loading = false;
        
        // Verificar si hay filtros en la URL a aplicar
        if (this.filtros.tipoPlanta) {
          this.aplicarFiltrosDesdeURL();
        }
      },
      error: (error) => {
        console.error('Error al obtener plantas:', error);
        this.error = 'Error al cargar las plantas. Por favor, intente más tarde.';
        this.loading = false;
      }
    });
  }

  aplicarFiltrosDesdeURL(): void {
    // Esta función aplica los filtros que vienen desde la URL
    this.loading = true;
    this.productsService.filterProducts(this.filtros).subscribe({
      next: (data) => {
        this.productosFiltrados = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al filtrar plantas:', error);
        this.error = 'Error al filtrar las plantas. Por favor, intente más tarde.';
        this.loading = false;
        // En caso de error, volver a los productos sin filtrar
        this.productosFiltrados = [...this.productos];
      }
    });
  }

  aplicarFiltros(): void {
    // Verificar si hay filtros seleccionados
    const hayFiltros = Object.values(this.filtros).some(value => !!value);
    
    if (hayFiltros) {
      // Si hay filtros, usar la API de filtrado
      this.loading = true;
      this.productsService.filterProducts(this.filtros).subscribe({
        next: (data) => {
          this.productosFiltrados = data;
          this.loading = false;
          
          // Actualizar los parámetros de la URL para reflejar los filtros
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: this.getQueryParams(),
            queryParamsHandling: 'merge'
          });
        },
        error: (error) => {
          console.error('Error al filtrar plantas:', error);
          this.error = 'Error al filtrar las plantas. Por favor, intente más tarde.';
          this.loading = false;
          // En caso de error, volver a los productos sin filtrar
          this.productosFiltrados = [...this.productos];
        }
      });
    } else {
      // Si no hay filtros, mostrar todos los productos y limpiar la URL
      this.productosFiltrados = [...this.productos];
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {}
      });
    }
  }

  resetFiltros(): void {
    this.filtros = {
      tipoPlanta: '',
      nivelLuz: '',
      nivelDificultad: '',
      frecuenciaRiego: ''
    };
    this.productosFiltrados = [...this.productos];
    
    // Limpiar los parámetros de la URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  // Función auxiliar para obtener los parámetros de consulta no vacíos
  private getQueryParams(): any {
    const params: any = {};
    Object.entries(this.filtros).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });
    return params;
  }

  addToCart(product: Product): void {
    if (product.stock > 0) {
      this.cartService.addToCart(product);
    }
  }

  verDetalles(product: Product): void {
    this.router.navigate(['/planta', product.id]);
  }

  // Función auxiliar para formatear precios
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }
}
