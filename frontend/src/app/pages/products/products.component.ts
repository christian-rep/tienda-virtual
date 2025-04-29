import { Component, OnInit } from '@angular/core';
import { ProductsService } from '../../services/products.service';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Product } from '../../interfaces/product.interface';

interface Filtros {
  categoria?: string;
  dificultad?: 'facil' | 'medio' | 'dificil';
  precio_min?: number;
  precio_max?: number;
}

interface QueryParams {
  categoria?: string;
  dificultad?: string;
  precio_min?: string;
  precio_max?: string;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class ProductsComponent implements OnInit {
  productos: Product[] = [];
  productosFiltrados: Product[] = [];
  error: string = '';
  loading: boolean = true;
  
  // Filtros actualizados
  filtros: Filtros = {
    categoria: '',
    dificultad: undefined,
    precio_min: undefined,
    precio_max: undefined
  };

  // Opciones para los selectores de filtros
  categorias: {id: number, nombre: string}[] = [];
  nivelesDificultad = [
    {value: 'facil', label: 'Fácil'},
    {value: 'medio', label: 'Medio'},
    {value: 'dificil', label: 'Difícil'}
  ];

  constructor(
    private productsService: ProductsService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategorias();
    
    this.route.queryParams.subscribe((params: QueryParams) => {
      if (params['categoria']) {
        this.filtros.categoria = params['categoria'];
      }
      if (params['dificultad']) {
        this.filtros.dificultad = params['dificultad'] as 'facil' | 'medio' | 'dificil';
      }
      if (params['precio_min']) {
        this.filtros.precio_min = Number(params['precio_min']);
      }
      if (params['precio_max']) {
        this.filtros.precio_max = Number(params['precio_max']);
      }
      
      if (Object.values(this.filtros).some(value => !!value)) {
        this.aplicarFiltrosDesdeURL();
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';
    
    this.productsService.getProducts().subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          this.error = 'No hay plantas disponibles en este momento.';
        } else {
          this.productos = data;
          this.productosFiltrados = [...this.productos];
        }
        this.loading = false;
        
        if (this.filtros.categoria || this.filtros.dificultad) {
          this.aplicarFiltrosDesdeURL();
        }
      },
      error: (error) => {
        console.error('Error al obtener plantas:', error);
        this.error = 'Error al cargar las plantas. Por favor, intente más tarde.';
        this.loading = false;
        this.productos = [];
        this.productosFiltrados = [];
      }
    });
  }

  loadCategorias(): void {
    this.productsService.getCategories().subscribe({
      next: (data) => {
        this.categorias = data;
        console.log('Categorías cargadas:', this.categorias);
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.error = 'Error al cargar las categorías. Por favor, intente más tarde.';
      }
    });
  }

  aplicarFiltrosDesdeURL(): void {
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
        this.productosFiltrados = [...this.productos];
      }
    });
  }

  aplicarFiltros(): void {
    const hayFiltros = Object.values(this.filtros).some(value => value !== undefined && value !== '');
    
    if (hayFiltros) {
      this.loading = true;
      this.productsService.filterProducts(this.filtros).subscribe({
        next: (data) => {
          this.productosFiltrados = data;
          this.loading = false;
          
          // Actualizar URL con los filtros actuales
          const queryParams: QueryParams = {};
          if (this.filtros.categoria) queryParams['categoria'] = this.filtros.categoria;
          if (this.filtros.dificultad) queryParams['dificultad'] = this.filtros.dificultad;
          if (this.filtros.precio_min !== undefined) queryParams['precio_min'] = this.filtros.precio_min.toString();
          if (this.filtros.precio_max !== undefined) queryParams['precio_max'] = this.filtros.precio_max.toString();

          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            queryParamsHandling: 'merge'
          });
        },
        error: (error) => {
          console.error('Error al filtrar plantas:', error);
          this.error = 'Error al filtrar las plantas. Por favor, intente más tarde.';
          this.loading = false;
          this.productosFiltrados = [...this.productos];
        }
      });
    } else {
      this.productosFiltrados = [...this.productos];
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {}
      });
    }
  }

  resetFiltros(): void {
    this.filtros = {
      categoria: '',
      dificultad: undefined,
      precio_min: undefined,
      precio_max: undefined
    };
    this.productosFiltrados = [...this.productos];
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  addToCart(product: Product): void {
    if (product.stock > 0) {
      this.cartService.addToCart(product);
    }
  }

  verDetalles(product: Product): void {
    this.router.navigate(['/planta', product.id]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }

  // Función para obtener la imagen principal o una por defecto
  getProductImage(product: Product): string {
    return product.imagen_principal || 'assets/images/planta-default.jpg';
  }

  // Función para obtener el nombre de la categoría
  getCategoryName(categoryId: number): string {
    const categoria = this.categorias.find(cat => cat.id === categoryId);
    return categoria ? categoria.nombre : 'Sin categoría';
  }

  getToxicidadNivel(toxicidades: { nivel: string; descripcion: string; detalles?: string }[] | undefined): string {
    if (!toxicidades || toxicidades.length === 0) return '';
    return toxicidades[0].nivel;
  }

  getToxicidadDescripcion(toxicidades: { nivel: string; descripcion: string; detalles?: string }[] | undefined): string {
    if (!toxicidades || toxicidades.length === 0) return '';
    return toxicidades[0].descripcion;
  }
}
