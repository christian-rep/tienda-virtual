import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api'; // Backend en español usa "productos"

  constructor(private http: HttpClient) {}

  getProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/productos`); // Cambiar "products" por "productos"
  }

  getProductById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/productos/${id}`); // Igual aquí
  }

  getChatResponse(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat?message=${query}`);
  }
}
