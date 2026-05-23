import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary con variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET() {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Si no están configuradas las variables, devolvemos un array vacío con un aviso
    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("⚠️ Advertencia: Variables de entorno de Cloudinary no configuradas.");
      return NextResponse.json({ images: [], warning: "Falta configurar .env.local" });
    }

    // Buscar todos los recursos en Cloudinary (imágenes)
    // Usamos el Search API para poder buscar por carpetas y obtener metadatos.
    // Buscamos recursos dentro de la carpeta 'ypofficial' (puedes cambiar este prefijo)
    const result = await cloudinary.search
      .expression('folder:ypofficial/* AND resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(500) // Soporta hasta 500 resultados por consulta
      .execute();

    const resources = result.resources || [];

    // Mapear los recursos de Cloudinary a nuestra estructura CatalogImage
    const mappedImages = resources.map((resource: any, index: number) => {
      const publicId = resource.public_id; // Ej: "ypofficial/mujeres/gorros-de-mono/foto1"
      const parts = publicId.split('/');

      let category = 'Mujeres';
      let subcategory = 'Gorro Unisex';

      // Estructura esperada: ["ypofficial", "mujeres|hombres", "gorros-de-mono|gorro-unisex", "nombre_archivo"]
      if (parts.length >= 3) {
        const catFolder = parts[1].toLowerCase();
        const subFolder = parts[2].toLowerCase();

        // Mapear Categoría
        if (catFolder === 'hombres' || catFolder === 'caballeros') {
          category = 'Hombres';
        } else {
          category = 'Mujeres';
        }

        // Mapear Subcategoría
        if (subFolder.includes('mono') || subFolder.includes('moño')) {
          subcategory = 'Gorros de Moño';
        } else {
          subcategory = 'Gorro Unisex';
        }
      }

      // Generar una descripción alternativa limpia desde el nombre del archivo
      const filename = parts[parts.length - 1] || 'Gorro Quirúrgico';
      const cleanAlt = filename
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char: string) => char.toUpperCase());

      return {
        id: index + 1,
        // Cloudinary ofrece URLs optimizadas reemplazando 'upload' por 'upload/f_auto,q_auto' (formato y calidad automática)
        src: resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_600/'),
        alt: cleanAlt,
        category,
        subcategory,
        tags: resource.tags || [category.toLowerCase(), subcategory.toLowerCase()],
      };
    });

    // Añadir encabezado para evitar almacenamiento en caché excesivo en producción
    return NextResponse.json(
      { images: mappedImages },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error al obtener imágenes de Cloudinary:', error);
    return NextResponse.json(
      { error: 'Error al obtener imágenes', details: error.message },
      { status: 500 }
    );
  }
}
