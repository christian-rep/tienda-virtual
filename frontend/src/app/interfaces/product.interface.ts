export interface Product {
    id: string;
    nombre: string;
    nombre_cientifico?: string;
    descripcion: string;
    precio: number;
    nivel_dificultad: 'facil' | 'medio' | 'dificil';
    stock: number;
    categorias: number[];
    activo: boolean;
    toxicidades: {
      id: number;
      nivel: string;
      descripcion: string;
      detalles: string;
    }[];
    imagenes?: {
      id: number;
      url: string;
      orden: number;
      es_principal: boolean;
    }[];
    imagen_principal?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
} 