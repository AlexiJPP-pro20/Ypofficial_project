import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Si existe CLOUDINARY_URL, el SDK de Cloudinary se configura automáticamente solo.
// De lo contrario, configuramos usando las variables individuales.
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function GET() {
  try {
    const hasConfig = 
      process.env.CLOUDINARY_URL || 
      (process.env.CLOUDINARY_CLOUD_NAME && 
       process.env.CLOUDINARY_API_KEY && 
       process.env.CLOUDINARY_API_SECRET);

    if (!hasConfig) {
      console.warn("⚠️ Advertencia: Variables de entorno de Cloudinary no configuradas.");
      return NextResponse.json({ images: [], warning: "Falta configurar las variables de entorno" });
    }

    // Usamos el API de Administración (Admin API) de recursos con prefijo
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'ypofficial/',
      max_results: 500,
      tags: true,
    });

    const resources = result.resources || [];

    // Mapear los recursos de Cloudinary a nuestra estructura CatalogImage
    const mappedImages = resources.map((resource: any, index: number) => {
      const publicId = resource.public_id; // Ej: "ypofficial/mujeres/gorros_de_moño/foto1"
      const parts = publicId.split('/');

      let category = 'Mujeres';
      let subcategory = 'Gorro Unisex';

      // Estructura esperada: ["ypofficial", "mujeres|hombres", "gorros_de_moño|gorros_unisex", "nombre_archivo"]
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

      // Optimización de la URL de Cloudinary
      const optimizedUrl = resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_600/');

      return {
        id: index + 1,
        src: optimizedUrl,
        alt: cleanAlt,
        category,
        subcategory,
        tags: resource.tags || [category.toLowerCase(), subcategory.toLowerCase()],
      };
    });

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
