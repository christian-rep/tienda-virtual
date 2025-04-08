import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private totalSubject = new BehaviorSubject<number>(0);

  cart$ = this.cartSubject.asObservable();
  total$ = this.totalSubject.asObservable();

  constructor() {
    // Intentar recuperar el carrito del localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.items = JSON.parse(savedCart);
      this.updateCart();
    }
  }

  private updateCart(): void {
    this.cartSubject.next(this.items);
    this.calculateTotal();
    // Guardar en localStorage
    localStorage.setItem('cart', JSON.stringify(this.items));
  }

  private calculateTotal(): void {
    const total = this.items.reduce((sum, item) => 
      sum + (item.product.precio * item.quantity), 0);
    this.totalSubject.next(total);
  }

  addToCart(product: Product, quantity: number = 1): void {
    const existingItem = this.items.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ product, quantity });
    }

    this.updateCart();
  }

  removeFromCart(productId: string): void {
    this.items = this.items.filter(item => item.product.id !== productId);
    this.updateCart();
  }

  updateQuantity(productId: string, quantity: number): void {
    const item = this.items.find(item => item.product.id === productId);
    if (item) {
      item.quantity = quantity;
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        this.updateCart();
      }
    }
  }

  clearCart(): void {
    this.items = [];
    this.updateCart();
  }

  getCartItems(): CartItem[] {
    return this.items;
  }

  getCart(): Observable<CartItem[]> {
    return this.cart$;
  }

  getCartCount(): number {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }
}
