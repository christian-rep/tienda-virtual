import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private totalSubject = new BehaviorSubject<number>(0);
  private cartItemCount = new BehaviorSubject<number>(0);

  cartItemCount$ = this.cartItemCount.asObservable();

  constructor() {
    this.loadCart();
  }

  private loadCart(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
      this.updateSubjects();
    }
  }

  private saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
    this.updateSubjects();
  }

  private updateSubjects(): void {
    this.cartSubject.next(this.cartItems);
    this.totalSubject.next(this.calculateTotal());
    this.updateCartCount();
  }

  private calculateTotal(): number {
    return this.cartItems.reduce((total, item) => {
      return total + (item.product.precio * item.quantity);
    }, 0);
  }

  getCart(): CartItem[] {
    return this.cartItems;
  }

  getCart$(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }

  getTotal$(): Observable<number> {
    return this.totalSubject.asObservable();
  }

  addToCart(product: CartItem['product']): void {
    const existingItem = this.cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cartItems.push({ product, quantity: 1 });
    }
    
    this.saveCart();
  }

  updateQuantity(productId: number | string, quantity: number): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item) {
      item.quantity = quantity;
      this.saveCart();
    }
  }

  removeFromCart(productId: number | string): void {
    this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
    this.saveCart();
  }

  clearCart(): void {
    this.cartItems = [];
    this.saveCart();
  }

  private updateCartCount(): void {
    const count = this.cartItems.reduce((total, item) => total + item.quantity, 0);
    this.cartItemCount.next(count);
  }

  getTotal(): Observable<number> {
    return this.cartSubject.pipe(
      map(items => items.reduce((total, item) => total + (item.product.precio * item.quantity), 0))
    );
  }
}
