'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CatalogImage } from '@/data/catalog';

type ImageCardProps = {
  image: CatalogImage;
  priority?: boolean;
};

export default function ImageCard({ image, priority = false }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="image-card">
      {/* Pattern badge */}
      {image.pattern && image.pattern !== 'Liso' && (
        <span className="image-card__badge">{image.pattern}</span>
      )}

      <div className="image-card__img-wrapper">
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

        {/* Hover overlay */}
        <div className="image-card__overlay" aria-hidden="true">
          <div className="image-card__meta">
            <div className="image-card__category">{image.category}</div>
            <div className="image-card__alt">{image.alt}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
