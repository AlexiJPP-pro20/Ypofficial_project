'use client';

import React, { useState } from 'react';
import { CatalogImage } from '@/data/catalog';

type ImageCardProps = {
  image: CatalogImage;
  priority?: boolean;
  onOpenLightbox?: (image: CatalogImage) => void;
  isNew?: boolean;
  bcvRate?: number | null;
};

export default function ImageCard({ image, priority = false, onOpenLightbox, isNew = false, bcvRate }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Helper to construct absolute image URL if it's local
  const getImageUrl = (src: string) => {
    if (typeof window !== 'undefined' && src.startsWith('/')) {
      return `${window.location.origin}${src}`;
    }
    return src;
  };

  // Helper to clean leading IDs/numbers from display title (e.g. "01 - Gorro" -> "Gorro")
  const getCleanTitle = (alt: string) => {
    const trimmed = alt.trim();
    // Si es solo un número, no es un título real
    if (/^\d+$/.test(trimmed)) {
      return '';
    }
    // Si es un archivo temporal/genérico de WhatsApp
    if (/^whatsapp\s+image/i.test(trimmed)) {
      return '';
    }
    // Si empieza por IMG o IMAGE seguido de números o fechas
    if (/^(img|image)[_\s-]*\d+/i.test(trimmed)) {
      return '';
    }

    let clean = alt.replace(/^[\d\s\-_#]+/, '').trim();
    
    // Eliminar el sufijo hash de 6 caracteres alfanuméricos al final si aún existe
    const words = clean.split(' ');
    if (words.length > 1) {
      const lastWord = words[words.length - 1];
      if (/^[a-zA-Z0-9]{6}$/.test(lastWord) && lastWord.toLowerCase() !== 'unisex') {
        words.pop();
        clean = words.join(' ');
      }
    }
    return clean;
  };

  const titleToDisplay = getCleanTitle(image.alt);

  const formatBs = (value: number) => {
    return value.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' Bs.';
  };

  // Helper to generate WhatsApp URL with custom pre-filled message
  const getWhatsAppUrl = () => {
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '584262623818';
    const imgUrl = getImageUrl(image.src);
    
    const modelLine = titleToDisplay 
      ? `- *Modelo:* ${titleToDisplay}` 
      : `- *Código:* ${image.alt}`;

    const priceLine = bcvRate
      ? `- *Precio:* $2.00 (${formatBs(2 * bcvRate)})`
      : `- *Precio:* $2.00`;

    const message = `¡Hola Ypofficial! Quisiera pedir esta prenda de su catálogo:
${modelLine}
${priceLine}
- *Foto:* ${imgUrl}`;

    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="image-card">
      {/* Pattern badge */}
      {image.pattern && image.pattern !== 'Liso' && (
        <span className="image-card__badge">{image.pattern}</span>
      )}

      {/* New badge */}
      {(isNew || image.isNew) && (
        <span className="image-card__badge--new">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          NUEVO!
        </span>
      )}

      <div 
        className="image-card__img-wrapper"
        onClick={() => onOpenLightbox?.(image)}
        role="button"
        tabIndex={0}
        aria-label={`Ver foto completa de ${titleToDisplay || 'gorro'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenLightbox?.(image);
          }
        }}
      >
        {/* Skeleton while loading */}
        {!loaded && !error && (
          <div
            className="image-skeleton"
            style={{ height: 280 }}
            aria-hidden="true"
          />
        )}

        {/* Fallback on error */}
        {error ? (
          <div
            style={{
              height: 220,
              background: 'var(--purple-pale)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 8,
              color: 'var(--purple-mid)',
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 32 }}>🪡</span>
            <span>Imagen no disponible</span>
          </div>
        ) : (
          <img
            src={image.src}
            alt={image.alt}
            className="image-card__img"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); setLoaded(true); }}
            loading={priority ? 'eager' : 'lazy'}
          />
        )}
      </div>

      {/* Card Content & WhatsApp Order Action */}
      <div className="image-card__content">
        <div className="image-card__info">
          <span className="image-card__category">
            {image.category} • {image.subcategory}
          </span>
          {titleToDisplay && (
            <h3 className="image-card__title" title={image.alt}>
              {titleToDisplay}
            </h3>
          )}
        </div>

        {/* Price Row */}
        <div className="image-card__price-row" aria-label="Precio del gorro">
          <span className="image-card__price-usd">$2.00</span>
          {bcvRate && (
            <span className="image-card__price-bs">{formatBs(2 * bcvRate)}</span>
          )}
        </div>

        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="image-card__whatsapp-btn"
        >
          <svg
            className="image-card__whatsapp-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.579 1.968 14.12 .94 11.5 1.056c-5.433 0-9.858 4.37-9.862 9.8.001 1.779.467 3.514 1.353 5.05L2.002 22l6.23-1.63c-1.554.856-3.18 1.484-1.585.784zm11.23-6.223c.302-.15.302-.45.051-.602-.251-.151-1.488-.732-1.718-.815-.23-.084-.397-.125-.565.125-.167.25-.646.815-.793.982-.147.166-.293.188-.595.037-.302-.15-1.274-.469-2.427-1.494-.897-.798-1.502-1.784-1.678-2.086-.176-.302-.019-.465.132-.615.136-.135.302-.35.453-.526.151-.176.201-.302.302-.503.101-.201.05-.377-.025-.526-.076-.15-1.02-2.464-1.397-3.37-.367-.887-.74-1.058-1.022-1.058-.282-.001-.565-.001-.847.001-.282 0-.74.106-1.127.525-.388.419-1.483 1.45-1.483 3.535 0 2.086 1.517 4.099 1.727 4.381.21.282 2.986 4.56 7.234 6.39.135.059.268.118.397.17.659.208 1.258.179 1.731.108.528-.079 1.62-.662 1.848-1.3.228-.638.228-1.186.16-1.3-.069-.113-.254-.18-.557-.33z" />
          </svg>
          Pedir por WhatsApp
        </a>
      </div>
    </div>
  );
}

