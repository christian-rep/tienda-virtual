export interface Toxicidad {
  id?: number;
  nivel: string;
  descripcion: string;
  detalles?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Planta {
  id: number | string;
  nombre: string;
  nombre_cientifico?: string;
  descripcion: string;
  precio: number;
  stock: number;
  nivel_dificultad: string;
  imagen_principal?: string;
  imagenes?: Array<{
    id: number;
    url: string;
    es_principal: boolean;
    orden?: number;
  }>;
  categorias: Categoria[];
  toxicidades: Toxicidad[];
  activo?: boolean;
} 