import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../../services/products.service';
import { Product } from '../../../interfaces/product.interface';

interface ImagenPrevia {
  file: File | null;
  url: string;
  id?: number;
  es_principal?: boolean;
}

@Component({
  selector: 'app-plant-management',
  templateUrl: './plant-management.component.html',
  styleUrls: ['./plant-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PlantManagementComponent implements OnInit {
  plantas: Product[] = [];
  plantaSeleccionada: Product | null = null;
  modoEdicion: 'crear' | 'editar' | null = null;
  loading: boolean = true;
  error: string = '';
  categorias: {id: number, nombre: string}[] = [];
  nivelesToxicidad: {id: number, nivel: string}[] = [];
  imagenesPrevia: ImagenPrevia[] = [];

  constructor(private productsService: ProductsService) {}

  ngOnInit(): void {
    this.cargarPlantas();
    this.cargarCategorias();
    this.cargarNivelesToxicidad();
  }

  cargarPlantas(): void {
    this.loading = true;
    this.productsService.getProducts().subscribe({
      next: (data) => {
        console.log('Plantas cargadas:', data);
        // Asegurarnos de que cada planta tenga un array de categorías
        this.plantas = data.map(planta => ({
          ...planta,
          categorias: planta.categorias || []
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar las plantas:', err);
        this.error = 'No se pudieron cargar las plantas. Por favor, intente más tarde.';
        this.loading = false;
      }
    });
  }

  cargarCategorias(): void {
    this.productsService.getCategories().subscribe({
      next: (data) => {
        console.log('Categorías cargadas:', data);
        this.categorias = data;
      },
      error: (err) => {
        console.error('Error al cargar las categorías:', err);
        this.error = 'No se pudieron cargar las categorías.';
      }
    });
  }

  cargarNivelesToxicidad(): void {
    this.productsService.getToxicidadLevels().subscribe({
      next: (data) => {
        this.nivelesToxicidad = data;
      },
      error: (err) => {
        console.error('Error al cargar los niveles de toxicidad:', err);
        this.error = 'No se pudieron cargar los niveles de toxicidad.';
      }
    });
  }

  nuevaPlanta(): void {
    this.plantaSeleccionada = {
      id: '',
      nombre: '',
      nombre_cientifico: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      nivel_dificultad: 'facil',
      categorias: [],
      activo: true,
      toxicidades: [{
        id: this.nivelesToxicidad.find(t => t.nivel === 'no_toxica')?.id || 1,
        nivel: 'no_toxica',
        descripcion: '',
        detalles: ''
      }]
    };
    this.modoEdicion = 'crear';
    this.imagenesPrevia = [];
  }

  editarPlanta(planta: Product): void {
    console.log('Editando planta:', planta);
    
    // Asegurarnos de que las categorías sean números y existan
    const categoriasNumericas = (planta.categorias || []).map(cat => {
      console.log('Categoría original:', cat);
      const catId = typeof cat === 'object' ? (cat as any).id : Number(cat);
      console.log('Categoría convertida:', catId);
      return catId;
    });
    
    console.log('Categorías convertidas:', categoriasNumericas);
    
    // Crear una copia profunda de la planta
    this.plantaSeleccionada = { 
      ...planta,
      categorias: categoriasNumericas,
      toxicidades: planta.toxicidades || [{
        id: this.nivelesToxicidad.find(t => t.nivel === 'no_toxica')?.id || 1,
        nivel: 'no_toxica',
        descripcion: '',
        detalles: ''
      }]
    };
    
    console.log('Planta seleccionada:', this.plantaSeleccionada);
    
    this.modoEdicion = 'editar';
    this.imagenesPrevia = [];

    // Cargar las imágenes existentes si las hay
    if (planta.imagenes && planta.imagenes.length > 0) {
      console.log('Cargando imágenes existentes:', planta.imagenes);
      this.imagenesPrevia = planta.imagenes.map(img => ({
        file: null,
        url: img.url,
        id: img.id,
        es_principal: img.es_principal
      }));
      console.log('Imágenes cargadas:', this.imagenesPrevia);
    }
  }

  cancelarEdicion(): void {
    this.plantaSeleccionada = null;
    this.modoEdicion = null;
    this.imagenesPrevia = [];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // Limitar a 5 imágenes
      if (this.imagenesPrevia.length + files.length > 5) {
        this.error = 'Solo se pueden subir hasta 5 imágenes.';
        return;
      }

      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.imagenesPrevia.push({
              file: file,
              url: e.target.result
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  removeImage(imagen: ImagenPrevia): void {
    const index = this.imagenesPrevia.indexOf(imagen);
    if (index > -1) {
      this.imagenesPrevia.splice(index, 1);
    }
  }

  guardarPlanta(): void {
    if (!this.plantaSeleccionada) return;

    // Asegurarnos de que las categorías sean números
    const categoriasNumericas = this.plantaSeleccionada.categorias.map(cat => 
      typeof cat === 'object' ? (cat as any).id : Number(cat)
    );
    this.plantaSeleccionada.categorias = categoriasNumericas;

    if (!this.plantaSeleccionada.toxicidades || this.plantaSeleccionada.toxicidades.length === 0) {
      const toxicidadNoToxica = this.nivelesToxicidad.find(t => t.nivel === 'no_toxica');
      this.plantaSeleccionada.toxicidades = [{
        id: toxicidadNoToxica?.id || 1,
        nivel: 'no_toxica',
        descripcion: '',
        detalles: ''
      }];
    }

    // Crear FormData para enviar las imágenes
    const formData = new FormData();
    formData.append('nombre', this.plantaSeleccionada.nombre);
    formData.append('nombre_cientifico', this.plantaSeleccionada.nombre_cientifico || '');
    formData.append('descripcion', this.plantaSeleccionada.descripcion);
    formData.append('precio', this.plantaSeleccionada.precio.toString());
    formData.append('nivel_dificultad', this.plantaSeleccionada.nivel_dificultad);
    formData.append('stock', this.plantaSeleccionada.stock.toString());
    
    // Agregar categorías
    this.plantaSeleccionada.categorias.forEach(catId => {
      formData.append('categorias[]', catId.toString());
    });
    
    // Agregar toxicidades
    this.plantaSeleccionada.toxicidades.forEach(t => {
      formData.append('toxicidades[]', JSON.stringify(t));
    });
    
    // Agregar solo las imágenes nuevas (las que tienen file)
    this.imagenesPrevia.forEach((imagen, index) => {
      if (imagen.file) {
        formData.append('imagenes', imagen.file);
        // Si es la primera imagen y no hay imágenes principales, marcarla como principal
        if (index === 0 && !this.imagenesPrevia.some(img => img.es_principal)) {
          formData.append('es_principal', 'true');
        }
      }
    });

    console.log('Enviando datos:', {
      planta: this.plantaSeleccionada,
      imagenes: this.imagenesPrevia
    });

    const operacion = this.modoEdicion === 'crear'
      ? this.productsService.createProduct(formData)
      : this.productsService.updateProduct(this.plantaSeleccionada.id, formData);

    operacion.subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.cargarPlantas();
        this.cancelarEdicion();
      },
      error: (err) => {
        console.error('Error al guardar la planta:', err);
        this.error = 'No se pudo guardar la planta. Por favor, intente más tarde.';
      }
    });
  }

  eliminarPlanta(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar esta planta?')) {
      this.productsService.deleteProduct(id).subscribe({
        next: () => {
          this.cargarPlantas();
        },
        error: (err) => {
          console.error('Error al eliminar la planta:', err);
          this.error = 'No se pudo eliminar la planta. Por favor, intente más tarde.';
        }
      });
    }
  }

  getCategoryName(catId: number): string {
    return this.categorias.find(c => c.id === catId)?.nombre || '';
  }

  actualizarToxicidad(nivel: string): void {
    if (!this.plantaSeleccionada) return;

    const toxicidadSeleccionada = this.nivelesToxicidad.find(t => t.nivel === nivel);
    if (!toxicidadSeleccionada) {
      console.error('No se encontró la toxicidad seleccionada:', nivel);
      return;
    }

    console.log('Toxicidad seleccionada:', toxicidadSeleccionada);

    // Actualizar o crear el array de toxicidades
    if (!this.plantaSeleccionada.toxicidades) {
      this.plantaSeleccionada.toxicidades = [];
    }

    // Actualizar la primera toxicidad o agregar una nueva
    if (this.plantaSeleccionada.toxicidades.length > 0) {
      this.plantaSeleccionada.toxicidades[0] = {
        id: toxicidadSeleccionada.id,
        nivel: toxicidadSeleccionada.nivel,
        descripcion: '',
        detalles: ''
      };
    } else {
      this.plantaSeleccionada.toxicidades.push({
        id: toxicidadSeleccionada.id,
        nivel: toxicidadSeleccionada.nivel,
        descripcion: '',
        detalles: ''
      });
    }

    console.log('Toxicidades actualizadas:', this.plantaSeleccionada.toxicidades);
  }
} 