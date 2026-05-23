# YP Modas — Catálogo Oficial 🪡

Landing page de catálogo de moda construida con **Next.js 14** y desplegada en **Vercel**.

## 🚀 Cómo arrancar en local

### Prerequisito: Instalar Node.js
Descarga e instala Node.js desde: https://nodejs.org (versión LTS)

### Comandos
```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar en desarrollo
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## 📸 Cómo agregar tus fotos

### Opción A — Fotos locales (pocas imágenes)
1. Copia tus fotos a la carpeta `/public/images/`
2. En `src/data/catalog.ts`, agrega un objeto así:
```typescript
{
  id: 13,  // número único
  src: "/images/mi-vestido.jpg",  // nombre de tu archivo
  alt: "Vestido azul de verano",
  category: "Vestidos",
  color: "Azul",
  collection: "Verano 2025",
  tags: ["casual", "verano"],
}
```

### Opción B — Cloudinary (recomendado para 500+ fotos) ⭐
1. Crea cuenta gratis en https://cloudinary.com
2. Sube tus fotos (puedes hacerlo por lotes/carpetas)
3. Usa la URL directa de Cloudinary en el campo `src`
4. Agrega `res.cloudinary.com` al `next.config.js` (ya está configurado)

## 🎨 Paleta de colores
| Color | Hex |
|-------|-----|
| Morado profundo | `#5C2E7A` |
| Morado principal | `#7B3FA0` |
| Rosa | `#E8708A` |
| Teal | `#4A9B9E` |
| Crema | `#FBF8F5` |

## 🌐 Deploy en Vercel
1. Sube el proyecto a GitHub
2. En vercel.com, importa el repositorio
3. Vercel detecta Next.js automáticamente — da click en **Deploy**

## 📁 Estructura del proyecto
```
src/
├── app/
│   ├── layout.tsx     → SEO, fuentes, metadatos
│   ├── page.tsx       → Página principal con filtros
│   └── globals.css    → Sistema de diseño completo
├── components/
│   ├── FilterPanel.tsx → Sidebar de filtros
│   └── ImageCard.tsx   → Tarjeta de imagen con hover
└── data/
    └── catalog.ts      → 📝 AQUÍ agregas tus fotos
```
