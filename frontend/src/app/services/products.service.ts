import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = 'http://localhost:5000/api/plantas'; // URL de la API de plantas
  private categoriesUrl = 'http://localhost:5000/api/categorias'; // Nueva URL para categorías

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('Error en la petición HTTP:', error);
    if (error.status === 0) {
      console.error('Error de conexión:', error.error);
      return throwError(() => new Error('Error de conexión con el servidor. Verifica que el backend esté funcionando.'));
    }
    return throwError(() => error);
  }

  // Obtener todas las plantas
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      tap(response => console.log('Respuesta del servidor (plantas):', response)),
      catchError(this.handleError)
    );
  }

  // Obtener una planta por ID
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Buscar plantas por término
  searchProducts(term: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search?q=${term}`).pipe(
      catchError(this.handleError)
    );
  }

  // Filtrar plantas por criterios
  filterProducts(filters: {
    categoria?: string,
    dificultad?: 'facil' | 'medio' | 'dificil',
    precio_min?: number,
    precio_max?: number
  }): Observable<Product[]> {
    let url = `${this.apiUrl}/filter?`;
    const params: string[] = [];
    
    if (filters.categoria) {
      params.push(`categoria=${encodeURIComponent(filters.categoria)}`);
    }
    
    if (filters.dificultad) {
      params.push(`dificultad=${encodeURIComponent(filters.dificultad)}`);
    }

    if (filters.precio_min !== undefined) {
      params.push(`precio_min=${filters.precio_min}`);
    }

    if (filters.precio_max !== undefined) {
      params.push(`precio_max=${filters.precio_max}`);
    }
    
    url += params.join('&');
    console.log('URL de filtrado:', url);
    return this.http.get<Product[]>(url).pipe(
      tap(response => console.log('Respuesta del servidor (filtros):', response)),
      catchError(this.handleError)
    );
  }

  // Obtener todas las categorías
  getCategories(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id: number, nombre: string}[]>(this.categoriesUrl).pipe(
      tap(response => console.log('Respuesta del servidor (categorías):', response)),
      catchError(this.handleError)
    );
  }

  // Crear una nueva planta (Admin)
  createProduct(product: Product): Observable<any> {
    return this.http.post<any>(this.apiUrl, product).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar una planta (Admin)
  updateProduct(id: string, product: Partial<Product>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, product).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar una planta (Admin)
  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
}