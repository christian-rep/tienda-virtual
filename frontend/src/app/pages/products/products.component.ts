import { Component, OnInit } from '@angular/core';
import { ProductsService } from '../../services/products.service';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Product } from '../../interfaces/product.interface';
import { Categoria } from '../../interfaces/plant.interface';

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
  categorias: Categoria[] = [];
  
  filtros: Filtros = {
    categoria: '',
    dificultad: undefined,
    precio_min: undefined,
    precio_max: undefined
  };

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
    
    this.route.queryParams.subscribe(params => {
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
    // Limpiar valores undefined y vacíos
    const filtrosLimpios: any = {};
    
    if (this.filtros.categoria && this.filtros.categoria !== '') {
      filtrosLimpios.categoria = this.filtros.categoria;
    }
    if (this.filtros.dificultad && this.filtros.dificultad !== undefined) {
      filtrosLimpios.dificultad = this.filtros.dificultad;
    }
    if (this.filtros.precio_min !== undefined && this.filtros.precio_min !== null) {
      filtrosLimpios.precio_min = this.filtros.precio_min;
    }
    if (this.filtros.precio_max !== undefined && this.filtros.precio_max !== null) {
      filtrosLimpios.precio_max = this.filtros.precio_max;
    }
    
    const hayFiltros = Object.keys(filtrosLimpios).length > 0;
    
    if (hayFiltros) {
      this.loading = true;
      this.error = '';
      
      console.log('Aplicando filtros:', filtrosLimpios);
      
      this.productsService.filterProducts(filtrosLimpios).subscribe({
        next: (data) => {
          console.log('Resultados del filtrado:', data);
          this.productosFiltrados = data || [];
          this.loading = false;
          
          // Actualizar URL con los filtros aplicados
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filtrosLimpios,
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
      // Si no hay filtros, mostrar todos los productos
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

  verDetalles(producto: Product): void {
    console.log('Navegando a detalles del producto:', producto.id);
    this.router.navigate(['/products', producto.id]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }

  getCategoryName(category: Categoria | number | any): string {
    if (typeof category === 'number') {
      const foundCategory = this.categorias.find(cat => cat.id === category);
      return foundCategory ? foundCategory.nombre : '';
    }
    if (typeof category === 'object' && category.nombre) {
      return category.nombre;
    }
    if (typeof category === 'string') {
      // Si es un string, intentar convertirlo a número
      const categoryId = parseInt(category, 10);
      if (!isNaN(categoryId)) {
        const foundCategory = this.categorias.find(cat => cat.id === categoryId);
        return foundCategory ? foundCategory.nombre : category;
      }
      return category;
    }
    return '';
  }

  getProductImage(product: Product): string {
    if (product.imagen_principal) {
      return product.imagen_principal;
    }
    return `assets/images/plantas/${product.id}/principal.jpg`;
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
