import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../interfaces/product.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProductDetailComponent implements OnInit {
  producto: Product | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService,
    private cartService: CartService
  ) {
    console.log('ProductDetailComponent inicializado');
  }

  ngOnInit(): void {
    console.log('ngOnInit iniciado');
    this.route.params.subscribe({
      next: (params) => {
        console.log('Parámetros de ruta recibidos:', params);
        const id = params['id'];
        if (id) {
          console.log('ID del producto recibido:', id);
          this.loadProduct(id);
        } else {
          console.error('No se recibió ID del producto');
          this.error = 'No se pudo cargar el producto';
          this.router.navigate(['/products']);
        }
      },
      error: (error) => {
        console.error('Error al obtener parámetros:', error);
        this.error = 'Error al cargar el producto';
        this.loading = false;
        this.router.navigate(['/products']);
      }
    });
  }

  private loadProduct(id: string): void {
    console.log('Iniciando carga del producto:', id);
    this.loading = true;
    this.error = '';
    
    this.productsService.getProductById(id).subscribe({
      next: (product) => {
        console.log('Producto cargado exitosamente:', product);
        if (!product) {
          console.error('El producto no existe');
          this.error = 'El producto no existe';
          this.loading = false;
          this.router.navigate(['/products']);
          return;
        }
        this.producto = product;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar el producto:', error);
        this.error = 'No se pudo cargar el producto';
        this.loading = false;
        this.router.navigate(['/products']);
      }
    });
  }

  getCategoryNames(): string {
    if (!this.producto?.categorias) return '';
    return this.producto.categorias.map(cat => cat.nombre).join(', ');
  }

  addToCart(product: Product): void {
    if (product.stock > 0) {
      this.cartService.addToCart(product);
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
} 