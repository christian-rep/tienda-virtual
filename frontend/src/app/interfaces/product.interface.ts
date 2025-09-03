import { Categoria, Toxicidad } from './plant.interface';

export interface Product {
    id: number | string;
    nombre: string;
    nombre_cientifico?: string;
    descripcion: string;
    precio: number;
    nivel_dificultad: string;
    stock: number;
    activo?: boolean;
    imagen_principal?: string;
    imagenes?: Array<{
      id: number;
      url: string;
      es_principal: boolean;
      orden?: number;
    }>;
    categorias: Categoria[];
    toxicidades: Toxicidad[];
    nombres_categorias?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
} 