/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Agrega aquí los dominios de tus imágenes cuando uses Cloudinary, Google Drive, etc.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
    ],
    // Optimización de imágenes para catálogos grandes
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

module.exports = nextConfig
