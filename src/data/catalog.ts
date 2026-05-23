// =====================================================
// CATÁLOGO DE IMÁGENES - YP
// =====================================================
// Para agregar imágenes, agrega objetos a este array.
// 
// FUTURA INTEGRACIÓN: Este archivo puede reemplazarse 
// con una API de Cloudinary, Google Drive o cualquier CMS.
//
// Estructura de cada imagen:
// {
//   id: número único,
//   src: URL de la imagen (local en /public/images/ o URL externa),
//   alt: descripción accesible,
//   category: categoría del producto,
//   subcategory: subcategoría opcional,
//   color: color principal,
//   collection: nombre de la colección/temporada,
//   tags: palabras clave adicionales para búsqueda
// }

export type CatalogImage = {
  id: number;
  src: string;
  alt: string;
  category: string; // "Mujeres" | "Hombres"
  subcategory: string; // "Gorros de Moño" | "Gorro Unisex"
  color: string;
  pattern: string; // Estampado, Liso, etc.
  tags: string[];
};

export const CATEGORIES = [
  "Todos",
  "Mujeres",
  "Hombres"
];

export const SUBCATEGORIES: Record<string, string[]> = {
  "Todos": ["Todos", "Gorros de Moño", "Gorro Unisex"],
  "Mujeres": ["Todos", "Gorros de Moño", "Gorro Unisex"],
  "Hombres": ["Todos", "Gorro Unisex"]
};

export const PATTERNS = [
  "Todos",
  "Estampado",
  "Liso",
  "Navideño",
  "Dibujos Animados",
  "Flores",
  "Figuras Geométricas",
  "Profesiones"
];

export const COLORS = [
  "Todos",
  "Azul",
  "Verde",
  "Rosa",
  "Morado",
  "Negro",
  "Blanco",
  "Celeste",
  "Multicolor"
];

// =====================================================
// IMÁGENES DE MUESTRA (REEMPLAZA CON TUS FOTOS REALES)
// =====================================================
export const catalogImages: CatalogImage[] = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&q=80",
    alt: "Gorro Quirúrgico de Moño - Flores Rosas y Moradas",
    category: "Mujeres",
    subcategory: "Gorros de Moño",
    color: "Rosa",
    pattern: "Flores",
    tags: ["flores", "rosa", "enfermera", "moño", "dama"],
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=80",
    alt: "Gorro Quirúrgico Unisex - Azul Marino Clásico",
    category: "Hombres",
    subcategory: "Gorro Unisex",
    color: "Azul",
    pattern: "Liso",
    tags: ["azul", "liso", "cirujano", "clasico", "unisex"],
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
    alt: "Gorro Quirúrgico Unisex - Dentistas e Instrumental Celeste",
    category: "Mujeres",
    subcategory: "Gorro Unisex",
    color: "Celeste",
    pattern: "Profesiones",
    tags: ["odontologia", "celeste", "dentistas", "estampado", "unisex"],
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&q=80",
    alt: "Gorro Quirúrgico Unisex - Estampado Latidos del Corazón",
    category: "Hombres",
    subcategory: "Gorro Unisex",
    color: "Negro",
    pattern: "Estampado",
    tags: ["corazon", "electrocardiograma", "negro", "medico", "unisex"],
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80",
    alt: "Gorro Quirúrgico de Moño - Morado Vibrante Liso",
    category: "Mujeres",
    subcategory: "Gorros de Moño",
    color: "Morado",
    pattern: "Liso",
    tags: ["morado", "liso", "enfermeria", "moño", "dama"],
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=600&q=80",
    alt: "Gorro Quirúrgico de Moño - Estampado de Gatitos y Huellas",
    category: "Mujeres",
    subcategory: "Gorros de Moño",
    color: "Multicolor",
    pattern: "Dibujos Animados",
    tags: ["gatos", "veterinaria", "huellas", "multicolor", "moño"],
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80",
    alt: "Gorro Quirúrgico Unisex - Verde Quirófano Clásico",
    category: "Hombres",
    subcategory: "Gorro Unisex",
    color: "Verde",
    pattern: "Liso",
    tags: ["verde", "liso", "cirugia", "clasico", "unisex"],
  }
];
