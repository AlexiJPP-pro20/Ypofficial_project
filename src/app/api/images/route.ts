import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Forzar revalidación instantánea (no cachear en build time)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// Al agregar el parámetro 'request', Next.js se ve obligado a compilar esta ruta como DYNAMIC (λ)
export async function GET(request: Request) {
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

    // Obtenemos todos los recursos de la cuenta usando paginación (soporta más de 500 imágenes)
    let allResources: any[] = [];
    let nextCursor: string | undefined = undefined;

    do {
      const options: any = {
        type: 'upload',
        max_results: 500,
      };
      if (nextCursor) {
        options.next_cursor = nextCursor;
      }
      
      const result = await cloudinary.api.resources(options);
      if (result.resources) {
        allResources = allResources.concat(result.resources);
      }
      nextCursor = result.next_cursor;
    } while (nextCursor);

    // Filtrar únicamente los recursos que pertenezcan a la carpeta 'ypofficial'
    const filteredResources = allResources.filter(
      (resource) => resource.asset_folder && resource.asset_folder.startsWith('ypofficial')
    );

    // Mapear los recursos de Cloudinary a nuestra estructura CatalogImage
    const mappedImages = filteredResources.map((resource: any, index: number) => {
      const folderPath = resource.asset_folder || ''; // Ej: "ypofficial/mujeres/gorros_de_moño"
      const parts = folderPath.split('/');

      let category = 'Mujeres';
      let subcategory = 'Gorro Unisex';

      // Estructura esperada: ["ypofficial", "mujeres|hombres", "gorros_de_moño|gorros_unisex"]
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

      // Generar una descripción alternativa limpia desde el display_name o public_id
      const filename = resource.display_name || resource.public_id || 'Gorro Quirúrgico';
      const baseFilename = filename.split('/').pop() || filename;
      
      // Eliminar el sufijo hash de 6 caracteres alfanuméricos de Cloudinary (ej: _m0eavn o -m0eavn)
      const filenameWithoutHash = baseFilename.replace(/[_-][a-zA-Z0-9]{6}$/, '');
      
      const cleanAlt = filenameWithoutHash
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
        tags: [category.toLowerCase(), subcategory.toLowerCase()],
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
