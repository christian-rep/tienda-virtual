export interface Product {
    id: string;
    nombre: string;
    nombre_cientifico?: string;
    descripcion: string;
    precio: number;
    nivel_dificultad: 'facil' | 'medio' | 'dificil';
    stock: number;
    imagen_principal?: string;
    imagenes_secundarias?: string[];
    categorias?: number[];
    created_at?: string;
    activo?: boolean;
    toxicidades?: Array<{
      nivel: string;
      descripcion: string;
      detalles?: string;
    }>;
}

export interface CartItem {
    product: Product;
    quantity: number;
} 