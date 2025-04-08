import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = 'http://localhost:5000/api/plantas'; // URL de la API de plantas

  constructor(private http: HttpClient) {}

  // Obtener todas las plantas
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  // Obtener una planta por ID
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // Buscar plantas por término
  searchProducts(term: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search?q=${term}`);
  }

  // Filtrar plantas por criterios
  filterProducts(filters: {
    tipoPlanta?: string,
    nivelLuz?: string,
    nivelDificultad?: string,
    frecuenciaRiego?: string
  }): Observable<Product[]> {
    // Construir la URL con los parámetros de filtro
    let url = `${this.apiUrl}/filter?`;
    const params: string[] = [];
    
    if (filters.tipoPlanta) {
      params.push(`tipoPlanta=${filters.tipoPlanta}`);
    }
    
    if (filters.nivelLuz) {
      params.push(`nivelLuz=${filters.nivelLuz}`);
    }
    
    if (filters.nivelDificultad) {
      params.push(`nivelDificultad=${filters.nivelDificultad}`);
    }
    
    if (filters.frecuenciaRiego) {
      params.push(`frecuenciaRiego=${filters.frecuenciaRiego}`);
    }
    
    url += params.join('&');
    return this.http.get<Product[]>(url);
  }

  // Crear una nueva planta (Admin)
  createProduct(product: Product): Observable<any> {
    return this.http.post<any>(this.apiUrl, product);
  }

  // Actualizar una planta (Admin)
  updateProduct(id: string, product: Partial<Product>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, product);
  }

  // Eliminar una planta (Admin)
  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
