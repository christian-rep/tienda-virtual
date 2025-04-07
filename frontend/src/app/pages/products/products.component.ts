import { Component, OnInit } from '@angular/core';
import { ProductsService } from '../../services/products.service';
import { CartService } from '../../services/cart.service';
import { NgFor, NgIf } from '@angular/common';
import { Product } from '../../interfaces/product.interface';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  imports: [NgFor, NgIf],
  standalone: true
})
export class ProductsComponent implements OnInit {
  productos: Product[] = [];
  error: string = '';
  loading: boolean = true;

  constructor(
    private productsService: ProductsService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productsService.getProducts().subscribe({
      next: (data) => {
        console.log("Productos obtenidos:", data);
        this.productos = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al obtener productos:', error);
        this.error = 'Error al cargar los productos. Por favor, intente más tarde.';
        this.loading = false;
      }
    });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  // Función auxiliar para formatear precios
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }
}
