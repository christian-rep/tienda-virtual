import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = 'http://localhost:5000/api/plantas'; // URL de la API de plantas
  private categoriesUrl = 'http://localhost:5000/api/categorias'; // Nueva URL para categorías
  private toxicidadUrl = 'http://localhost:5000/api/toxicidad'; // Nueva URL para toxicidad
  private defaultImage = 'assets/images/planta-default.jpg';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('Error en la petición HTTP:', error);
    let errorMessage = 'Error al procesar la solicitud';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Error ${error.status}: ${error.error?.message || error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Método para procesar las imágenes de las plantas
  private processPlantImages(plant: Product): Product {
    if (plant.imagenes && plant.imagenes.length > 0) {
      // Convertir las URLs de las imágenes a rutas locales
      plant.imagenes = plant.imagenes.map(img => ({
        ...img,
        url: `assets/images/plantas/${plant.id}/${img.url}`
      }));
      // Establecer la imagen principal
      const principalImage = plant.imagenes.find(img => img.es_principal);
      plant.imagen_principal = principalImage ? principalImage.url : this.defaultImage;
    } else {
      plant.imagen_principal = this.defaultImage;
    }
    return plant;
  }

  // Obtener todas las plantas
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      map(plants => plants.map(plant => this.processPlantImages(plant))),
      tap(response => console.log('Respuesta del servidor (plantas):', response)),
      catchError(this.handleError)
    );
  }

  // Obtener una planta por ID
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      map(plant => this.processPlantImages(plant)),
      tap(response => console.log('Respuesta del servidor (planta):', response)),
      catchError(this.handleError)
    );
  }

  // Buscar plantas por término
  searchProducts(term: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search?q=${term}`).pipe(
      map(plants => plants.map(plant => this.processPlantImages(plant))),
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
      map(plants => plants.map(plant => this.processPlantImages(plant))),
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

  // Obtener niveles de toxicidad
  getToxicidadLevels(): Observable<{id: number, nivel: string}[]> {
    return this.http.get<{id: number, nivel: string}[]>(this.toxicidadUrl).pipe(
      tap(response => console.log('Respuesta del servidor (toxicidad):', response)),
      catchError(this.handleError)
    );
  }

  // Crear una nueva planta (Admin)
  createProduct(product: Product | FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, product).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar una planta (Admin)
  updateProduct(id: string, product: Partial<Product> | FormData): Observable<any> {
    console.log('Actualizando producto:', { id, product });
    return this.http.put<any>(`${this.apiUrl}/${id}`, product).pipe(
      tap(response => console.log('Respuesta de actualización:', response)),
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