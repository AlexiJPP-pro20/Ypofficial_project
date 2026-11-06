'use client';

import React, { useState } from 'react';
import { BsWhatsapp } from 'react-icons/bs';
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
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '584146430116';
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
          <BsWhatsapp className="image-card__whatsapp-icon" size={16} />
          Pedir por WhatsApp
        </a>
      </div>
    </div>
  );
}

