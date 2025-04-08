import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../services/products.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../interfaces/product.interface';

@Component({
  selector: 'app-plant-details',
  templateUrl: './plant-details.component.html',
  styleUrls: ['./plant-details.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class PlantDetailsComponent implements OnInit {
  planta: Product | null = null;
  loading: boolean = true;
  error: string = '';
  cantidad: number = 1;

  constructor(
    private route: ActivatedRoute,
    private productsService: ProductsService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarPlanta(id);
      } else {
        this.error = 'ID de planta no encontrado';
        this.loading = false;
      }
    });
  }

  cargarPlanta(id: string): void {
    this.loading = true;
    this.productsService.getProductById(id).subscribe({
      next: (data) => {
        this.planta = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar los detalles de la planta:', err);
        this.error = 'No se pudo cargar la información de la planta. Por favor, intente más tarde.';
        this.loading = false;
      }
    });
  }

  agregarAlCarrito(): void {
    if (this.planta && this.planta.stock >= this.cantidad) {
      // Añadir la planta al carrito con la cantidad especificada
      for (let i = 0; i < this.cantidad; i++) {
        this.cartService.addToCart(this.planta);
      }
    }
  }

  incrementarCantidad(): void {
    if (this.planta && this.cantidad < this.planta.stock) {
      this.cantidad++;
    }
  }

  decrementarCantidad(): void {
    if (this.cantidad > 1) {
      this.cantidad--;
    }
  }

  // Función auxiliar para formatear precios
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }
} 