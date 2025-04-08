export interface Product {
    id: string;
    nombre: string;
    nombreCientifico?: string;
    descripcion: string;
    precio: number;
    imagen?: string;
    
    // Características de la planta
    tipoPlanta: string; // interior, exterior, suculenta, etc.
    alturaCm?: number;
    anchoCm?: number;
    tipoHoja?: string; // perenne, caduca
    colorHojas?: string;
    colorFlores?: string;
    epocaFloracion?: string;
    
    // Requerimientos
    tipoSuelo?: string;
    nivelLuz: string; // sombra, parcial, pleno sol
    frecuenciaRiego: string; // bajo, medio, alto
    temperaturaMinC?: number;
    temperaturaMaxC?: number;
    humedadRequerida?: string; // baja, media, alta
    
    // Información adicional
    beneficios?: string[]; // purificación de aire, repelente insectos, etc.
    toxicidad?: string; // no tóxico, tóxico para mascotas, etc.
    nivelDificultad: string; // principiante, intermedio, experto
    stock: number;
}

export interface CartItem {
    product: Product;
    quantity: number;
} 