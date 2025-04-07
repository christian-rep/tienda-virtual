import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = 'http://localhost:5000/api/productos'; // URL de la API

  constructor(private http: HttpClient) {}

  // Obtener todos los productos
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Obtener un producto por ID
  getProductById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Buscar productos por término
  searchProducts(term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?q=${term}`);
  }
}
