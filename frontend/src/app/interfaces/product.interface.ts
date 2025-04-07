export interface Product {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
} 