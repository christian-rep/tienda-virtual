import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, switchMap, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Product } from '../interfaces/product.interface';
import { environment } from '../../environments/environment';
import { Planta, Categoria, Toxicidad } from '../interfaces/plant.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = environment.apiUrl;
  private defaultImage = 'assets/images/plantas/default/principal.jpg';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('Error en la petición HTTP:', error);
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Error ${error.status}: ${error.error?.message || error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Método para procesar las imágenes de las plantas
  private processPlantImages(plant: Product): Product {
    console.log('Procesando planta:', plant.id);
    console.log('Datos originales:', JSON.stringify(plant, null, 2));

    // Asegurarnos de que la imagen principal tenga la ruta correcta
    if (plant.imagen_principal) {
      // Si la imagen principal ya tiene la ruta correcta, la dejamos así
      if (plant.imagen_principal.includes(`assets/images/plantas/${plant.id}/principal.jpg`)) {
        return plant;
      }
      // Si no, la actualizamos
      plant.imagen_principal = `assets/images/plantas/${plant.id}/principal.jpg`;
    } else {
      // Si no hay imagen principal, la establecemos
      plant.imagen_principal = `assets/images/plantas/${plant.id}/principal.jpg`;
    }

    // Asegurarnos de que las imágenes en el array también tengan las rutas correctas
    if (plant.imagenes && plant.imagenes.length > 0) {
      plant.imagenes = plant.imagenes.map(img => ({
        ...img,
        url: `assets/images/plantas/${plant.id}/principal.jpg`
      }));
    }

    return plant;
  }

  // Obtener todas las plantas
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/productos`)
      .pipe(
        map(plantas => {
          console.log('Plantas recibidas del servidor:', plantas);
          return plantas.map(planta => {
            // Procesar categorías
            const categoriasProcesadas = planta.categorias ? 
              (Array.isArray(planta.categorias) ? planta.categorias : [planta.categorias]) : [];
            
            return {
              ...planta,
              categorias: categoriasProcesadas,
              toxicidades: planta.toxicidades || []
            };
          });
        }),
        map(plantas => plantas.map(planta => this.processPlantImages(planta))),
        tap(data => console.log('Plantas procesadas:', data)),
        catchError(this.handleError)
      );
  }

  // Obtener una planta por ID
  getProductById(id: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/productos/${id}`)
      .pipe(
        map(planta => this.processPlantImages(planta)),
        tap(data => console.log('Planta obtenida:', data)),
        catchError(this.handleError)
      );
  }

  // Buscar plantas por término
  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/productos/buscar`, {
      params: { q: query }
    }).pipe(
      map(plantas => plantas.map(planta => this.processPlantImages(planta))),
      catchError(this.handleError)
    );
  }

  // Filtrar plantas por criterios
  filterProducts(filters: any): Observable<Product[]> {
    console.log('Filtros enviados al servicio:', filters);
    
    return this.http.get<Product[]>(`${this.apiUrl}/productos/filtrar`, {
      params: filters
    }).pipe(
      map(plantas => {
        console.log('Plantas recibidas del filtrado:', plantas);
        return plantas.map(planta => {
          // Procesar categorías
          const categoriasProcesadas = planta.categorias ? 
            (Array.isArray(planta.categorias) ? planta.categorias : [planta.categorias]) : [];
          
          return {
            ...planta,
            categorias: categoriasProcesadas,
            toxicidades: planta.toxicidades || []
          };
        });
      }),
      map(plantas => plantas.map(planta => this.processPlantImages(planta))),
      tap(data => console.log('Plantas filtradas procesadas:', data)),
      catchError(this.handleError)
    );
  }

  // Obtener todas las categorías
  getCategories(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`)
      .pipe(
        tap(data => console.log('Categorías obtenidas:', data)),
        catchError(this.handleError)
      );
  }

  // Obtener niveles de toxicidad
  getToxicidadLevels(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/toxicidad`)
      .pipe(
        tap(data => console.log('Niveles de toxicidad obtenidos:', data)),
        catchError(this.handleError)
      );
  }

  // Actualizar una planta (Admin)
  updateProduct(id: string, plantData: any, imagenes: File[]): Observable<any> {
    const formData = new FormData();
    
    // Agregar los datos de la planta como JSON
    formData.append('plantData', JSON.stringify(plantData));
    
    // Agregar las imágenes
    if (imagenes && imagenes.length > 0) {
      imagenes.forEach((imagen, index) => {
        formData.append('imagenes', imagen);
      });
    }

    return this.http.put(`${this.apiUrl}/productos/${id}`, formData);
  }

  // Crear una nueva planta (Admin)
  createProduct(product: Product, images: File[]): Observable<Product> {
    // Primero crear la planta sin imágenes
    const formData = new FormData();
    
    // Agregar datos básicos
    formData.append('nombre', product.nombre);
    formData.append('nombre_cientifico', product.nombre_cientifico || '');
    formData.append('descripcion', product.descripcion);
    formData.append('precio', product.precio.toString());
    formData.append('nivel_dificultad', product.nivel_dificultad);
    formData.append('stock', product.stock.toString());
    
    // Agregar categorías como array de números
    if (product.categorias && product.categorias.length > 0) {
      const categoriasIds = product.categorias.map(cat => 
        typeof cat === 'object' ? cat.id : Number(cat)
      );
      console.log('Categorías a enviar:', categoriasIds);
      formData.append('categorias', JSON.stringify(categoriasIds));
    } else {
      formData.append('categorias', JSON.stringify([]));
    }
    
    // Agregar toxicidades como array de objetos
    if (product.toxicidades && product.toxicidades.length > 0) {
      const toxicidadesData = product.toxicidades.map(t => ({
        id: typeof t === 'object' ? t.id : Number(t),
        nivel: typeof t === 'object' ? t.nivel : 'no_toxica',
        descripcion: typeof t === 'object' ? t.descripcion : '',
        detalles: typeof t === 'object' ? t.detalles : ''
      }));
      console.log('Toxicidades a enviar:', toxicidadesData);
      formData.append('toxicidades', JSON.stringify(toxicidadesData));
    } else {
      formData.append('toxicidades', JSON.stringify([]));
    }
    
    console.log('Enviando datos al servidor:', {
      nombre: product.nombre,
      categorias: product.categorias,
      toxicidades: product.toxicidades
    });
    
    return this.http.post<Product>(`${this.apiUrl}/productos`, formData).pipe(
      tap(response => console.log('Respuesta del servidor:', response)),
      // Si hay imágenes, enviarlas después de crear la planta
      switchMap(response => {
        if (images && images.length > 0) {
          const imageFormData = new FormData();
          images.forEach((image, index) => {
            imageFormData.append('imagenes', image);
          });
          
          return this.http.put<Product>(`${this.apiUrl}/productos/${response.id}/imagen`, imageFormData).pipe(
            map(() => response)
          );
        }
        return of(response);
      }),
      catchError(error => {
        console.error('Error al crear producto:', error);
        return throwError(() => error);
      })
    );
  }

  // Eliminar una planta (Admin)
  deleteProduct(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/productos/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
}