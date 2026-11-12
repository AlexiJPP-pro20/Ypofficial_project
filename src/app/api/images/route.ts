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

    // Filtrar recursos que pertenezcan a 'ypofficial' y excluir 'gorros_unisex'
    const filteredResources = allResources.filter((resource) => {
      const folder = (resource.asset_folder || resource.folder || '').toLowerCase();
      const publicId = (resource.public_id || '').toLowerCase();

      // Exclusión estricta de la carpeta eliminada 'gorros_unisex'
      if (folder.includes('gorros_unisex') || publicId.includes('gorros_unisex')) {
        return false;
      }

      return (
        folder.startsWith('ypofficial') ||
        folder.includes('gorros_de_moño') ||
        folder.includes('gorros_de_mono') ||
        publicId.startsWith('ypofficial') ||
        publicId.includes('gorros_de_moño') ||
        publicId.includes('gorros_de_mono')
      );
    });

    // Mapear los recursos de Cloudinary a nuestra estructura CatalogImage
    const mappedImages = filteredResources.map((resource: any, index: number) => {
      // Obtener el nombre del archivo base sin carpetas
      const rawName = resource.display_name || resource.public_id || 'Gorro';
      const baseFilename = rawName.split('/').pop() || rawName;
      
      // Eliminar el sufijo hash generado por Cloudinary (ej: mujer_01_m0eavn o mujer_01-m0eavn)
      const filenameWithoutHash = baseFilename.replace(/[_-][a-zA-Z0-9]{6}$/, '');
      // Quitar extensión de archivo si viene incluida (.jpg, .png, etc.)
      const cleanName = filenameWithoutHash.replace(/\.[^/.]+$/, '');
      const lowerClean = cleanName.toLowerCase();

      // Mapear Categoría según el prefijo/nombre del archivo (mujer_xx -> Mujeres, hombre_xx -> Hombres)
      let category = 'Mujeres';
      if (lowerClean.startsWith('hombre') || lowerClean.includes('hombre')) {
        category = 'Hombres';
      } else if (lowerClean.startsWith('mujer') || lowerClean.includes('mujer')) {
        category = 'Mujeres';
      } else {
        // Fallback por nombre de carpeta si aplica
        const folderPath = (resource.asset_folder || resource.folder || '').toLowerCase();
        if (folderPath.includes('hombre') || folderPath.includes('caballero')) {
          category = 'Hombres';
        } else {
          category = 'Mujeres';
        }
      }

      // La única carpeta/modelo activa es gorros_de_moño
      const subcategory = 'Gorros de Moño';

      // Título limpio para mostrar en la tarjeta (ej: "Mujer 01", "Hombre 02")
      const cleanAlt = cleanName
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
        tags: [category.toLowerCase(), 'gorros de moño', cleanName.toLowerCase()],
        createdAt: resource.created_at,
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
