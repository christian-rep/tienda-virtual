import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductsService } from '../../../services/products.service';
import { Product } from '../../../interfaces/product.interface';
import { Planta, Toxicidad, Categoria } from '../../../interfaces/plant.interface';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class PlantManagementComponent implements OnInit {
  plantas: Planta[] = [];
  categorias: Categoria[] = [];
  nivelesToxicidad: Toxicidad[] = [];
  plantaSeleccionada: Planta | null = null;
  plantaForm: FormGroup;
  imagenesPrevia: ImagenPrevia[] = [];
  modoEdicion: 'crear' | 'editar' | null = null;
  loading: boolean = true;
  error: string = '';
  imagenesSeleccionadas: File[] = [];

  constructor(
    private productsService: ProductsService,
    private fb: FormBuilder
  ) {
    this.plantaForm = this.fb.group({
      nombre: ['', Validators.required],
      nombre_cientifico: [''],
      descripcion: ['', Validators.required],
      precio: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      nivel_dificultad: ['facil', Validators.required],
      categorias: [[], Validators.required],
      toxicidades: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarNivelesToxicidad();
    this.cargarPlantas();
  }

  cargarPlantas(): void {
    this.loading = true;
    this.productsService.getProducts().subscribe({
      next: (data) => {
        console.log('Plantas cargadas:', data);
        this.plantas = data.map(planta => {
          const categoriasProcesadas = planta.categorias.map(cat => {
            if (typeof cat === 'object') {
              return cat;
            } else {
              const categoriaEncontrada = this.categorias.find(c => c.id === Number(cat));
              return categoriaEncontrada || { id: Number(cat), nombre: '' };
            }
          });

          return {
            ...planta,
            id: planta.id,
            categorias: categoriasProcesadas,
            toxicidades: planta.toxicidades || []
          };
        });
        console.log('Plantas procesadas:', this.plantas);
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
        this.cargarPlantas();
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
        this.nivelesToxicidad = data.map(t => ({
          id: t.id,
          nivel: t.nivel,
          descripcion: t.descripcion || '',
          detalles: t.detalles || ''
        }));
      },
      error: (err) => {
        console.error('Error al cargar los niveles de toxicidad:', err);
        this.error = 'No se pudieron cargar los niveles de toxicidad.';
      }
    });
  }

  nuevaPlanta(): void {
    const toxicidadNoToxica = this.nivelesToxicidad.find(t => t.nivel === 'no_toxica');
    
    this.plantaForm.reset({
      nombre: '',
      nombre_cientifico: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      nivel_dificultad: 'facil',
      categorias: [],
      toxicidades: toxicidadNoToxica?.id || 1
    });

    this.plantaSeleccionada = {
      id: 0,
      nombre: '',
      nombre_cientifico: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      nivel_dificultad: 'facil',
      categorias: [],
      toxicidades: [{
        id: toxicidadNoToxica?.id || 1,
        nivel: 'no_toxica',
        descripcion: toxicidadNoToxica?.descripcion || '',
        detalles: ''
      }],
      activo: true
    };
    
    this.modoEdicion = 'crear';
    this.imagenesPrevia = [];
  }

  editarPlanta(planta: Planta): void {
    console.log('Editando planta:', planta);
    
    // Asegurarnos de que las categorías sean números
    const categoriasIds = planta.categorias.map(cat => {
      if (typeof cat === 'object') {
        return cat.id;
      }
      return Number(cat);
    });
    
    // Obtener el ID de la toxicidad
    let toxicidadId;
    if (planta.toxicidades && planta.toxicidades.length > 0) {
      if (typeof planta.toxicidades[0] === 'object') {
        toxicidadId = planta.toxicidades[0].id;
      } else {
        toxicidadId = Number(planta.toxicidades[0]);
      }
    } else {
      toxicidadId = this.nivelesToxicidad.find(t => t.nivel === 'no_toxica')?.id || 1;
    }
    
    console.log('Categorías seleccionadas:', categoriasIds);
    console.log('Toxicidad seleccionada:', toxicidadId);
    
    // Actualizar el formulario
    this.plantaForm.patchValue({
      nombre: planta.nombre,
      nombre_cientifico: planta.nombre_cientifico || '',
      descripcion: planta.descripcion,
      precio: planta.precio,
      stock: planta.stock,
      nivel_dificultad: planta.nivel_dificultad,
      categorias: categoriasIds,
      toxicidades: toxicidadId
    });
    
    this.plantaSeleccionada = planta;
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
    }
  }

  cancelarEdicion(): void {
    this.plantaSeleccionada = null;
    this.modoEdicion = null;
    this.imagenesPrevia = [];
    this.plantaForm.reset();
    this.error = '';
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
            // Convertir la imagen a JPEG si no lo es
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                  if (blob) {
                    const jpegFile = new File([blob], 'temp.jpg', { type: 'image/jpeg' });
                    this.imagenesPrevia.push({
                      file: jpegFile,
                      url: e.target.result,
                      es_principal: this.imagenesPrevia.length === 0 // La primera imagen será la principal
                    });
                  }
                }, 'image/jpeg', 0.9);
              }
            };
            img.src = e.target.result;
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
      // Si eliminamos la imagen principal, hacer la primera imagen restante como principal
      if (imagen.es_principal && this.imagenesPrevia.length > 0) {
        this.imagenesPrevia[0].es_principal = true;
      }
    }
  }

  setPrincipalImage(imagen: ImagenPrevia): void {
    this.imagenesPrevia.forEach(img => {
      img.es_principal = img === imagen;
    });
  }

  guardarPlanta(): void {
    if (this.plantaForm.valid) {
      const formData = this.plantaForm.value;
      
      // Preparar los datos antes de enviarlos
      const plantData = {
        ...formData,
        // Asegurarnos de que las categorías sean un array de números
        categorias: Array.isArray(formData.categorias) ? formData.categorias : [formData.categorias],
        // Asegurarnos de que las toxicidades sean un array de objetos
        toxicidades: [{
          id: formData.toxicidades,
          nivel: this.nivelesToxicidad.find(t => t.id === formData.toxicidades)?.nivel || 'no_toxica',
          descripcion: this.nivelesToxicidad.find(t => t.id === formData.toxicidades)?.descripcion || '',
          detalles: ''
        }]
      };

      // Preparar las imágenes
      const imagenes = this.imagenesPrevia
        .filter(img => img.file)
        .map(img => img.file as File);
      
      console.log('Datos a enviar:', {
        plantData,
        imagenes: imagenes.length
      });
      
      if (this.plantaSeleccionada && this.plantaSeleccionada.id !== 0) {
        // Actualizar planta existente
        this.productsService.updateProduct(this.plantaSeleccionada.id.toString(), plantData, imagenes)
          .subscribe({
            next: (response) => {
              console.log('Planta actualizada:', response);
              this.mostrarMensaje('Planta actualizada exitosamente');
              this.cargarPlantas();
              this.cerrarModal();
            },
            error: (error) => {
              console.error('Error al actualizar planta:', error);
              this.mostrarMensaje('Error al actualizar la planta', true);
            }
          });
      } else {
        // Crear nueva planta
        this.productsService.createProduct(plantData, imagenes)
          .subscribe({
            next: (response) => {
              console.log('Planta creada:', response);
              this.mostrarMensaje('Planta creada exitosamente');
              this.cargarPlantas();
              this.cerrarModal();
            },
            error: (error) => {
              console.error('Error al crear planta:', error);
              this.mostrarMensaje('Error al crear la planta', true);
            }
          });
      }
    } else {
      this.plantaForm.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos requeridos', true);
    }
  }

  eliminarPlanta(id: number | string): void {
    if (confirm('¿Está seguro de que desea eliminar esta planta?')) {
      console.log('Eliminando planta con ID:', id);
      this.productsService.deleteProduct(id.toString()).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor al eliminar:', response);
          this.plantas = this.plantas.filter(planta => planta.id !== id);
          console.log('Lista de plantas actualizada:', this.plantas);
        },
        error: (err) => {
          console.error('Error al eliminar la planta:', err);
          this.error = 'No se pudo eliminar la planta. Por favor, intente más tarde.';
        }
      });
    }
  }

  getCategoryName(category: Categoria | number | any): string {
    if (typeof category === 'number') {
      const foundCategory = this.categorias.find(cat => cat.id === category);
      return foundCategory ? foundCategory.nombre : '';
    }
    if (typeof category === 'object' && category.nombre) {
      return category.nombre;
    }
    return '';
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

  private preparePlantData(planta: Planta): Planta {
    const toxicidadNoToxica = this.nivelesToxicidad.find(t => t.nivel === 'no_toxica');
    const categoriasNumericas = planta.categorias?.map(cat => cat.id) || [];

    return {
      ...planta,
      toxicidades: [{
        nivel: toxicidadNoToxica?.nivel || 'no_toxica',
        descripcion: toxicidadNoToxica?.descripcion || 'No tóxica',
        detalles: toxicidadNoToxica?.detalles || ''
      }],
      categorias: categoriasNumericas.map(id => ({ id, nombre: this.getCategoryName(id) }))
    };
  }

  private prepareToxicidadData(toxicidad: Toxicidad): Toxicidad {
    return {
      nivel: toxicidad.nivel,
      descripcion: toxicidad.descripcion,
      detalles: toxicidad.detalles || ''
    };
  }

  cerrarModal(): void {
    this.plantaSeleccionada = null;
    this.plantaForm.reset();
    this.imagenesSeleccionadas = [];
    this.error = '';
  }

  mostrarMensaje(mensaje: string, esError: boolean = false): void {
    if (esError) {
      console.error(mensaje);
      this.error = mensaje;
    } else {
      console.log(mensaje);
      this.error = '';
    }
  }
} 