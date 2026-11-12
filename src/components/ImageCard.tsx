'use client';

import React, { useState } from 'react';
import { BsWhatsapp, BsFire, BsLightningChargeFill, BsBagPlus } from 'react-icons/bs';
import { CatalogImage } from '@/data/catalog';
import { useCart } from '@/context/CartContext';
import { calculatePricingMetrics } from '@/config/pricing';
import { buildSingleItemWhatsAppUrl, formatBs, getCleanTitle } from '@/utils/whatsapp';

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
  const { addItem, updateQuantity, getItemQuantity } = useCart();

  const quantityInCart = getItemQuantity(image.id);
  const { unitPriceUSD, wholesalePriceUSD, wholesaleMinUnits, discountPercent, promoActive } =
    calculatePricingMetrics();

  const titleToDisplay = getCleanTitle(image.alt);
  const whatsappUrl = buildSingleItemWhatsAppUrl(image, bcvRate);

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

        {/* Price Section */}
        <div className="image-card__price-section" aria-label="Precio del gorro">
          <div className="image-card__price-row">
            <span className="image-card__price-usd">${unitPriceUSD.toFixed(2)}</span>
            <span className="image-card__price-unit">c/u</span>
            {bcvRate && (
              <span className="image-card__price-bs">({formatBs(unitPriceUSD * bcvRate)})</span>
            )}
          </div>
          {promoActive && (
            <div className="image-card__wholesale-badge">
              <div className="image-card__wholesale-top">
                <span className="image-card__wholesale-text">
                  <BsFire className="image-card__wholesale-icon" size={13} />
                  {discountPercent}% OFF ({wholesaleMinUnits}+ UDS)
                </span>
                <span className="image-card__discount-tag">
                  <BsLightningChargeFill size={10} />
                  -{discountPercent}%
                </span>
              </div>
              <div className="image-card__wholesale-price">
                <span>
                  <span className="image-card__wholesale-old">${unitPriceUSD.toFixed(2)}</span>
                  <strong>${wholesalePriceUSD.toFixed(2)} c/u</strong>
                </span>
                {bcvRate && (
                  <span className="image-card__wholesale-bs">
                    ({formatBs(wholesalePriceUSD * bcvRate)})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions: Accumulator + Direct WhatsApp */}
        <div className="image-card__actions">
          {quantityInCart === 0 ? (
            <button
              type="button"
              className="image-card__cart-btn"
              onClick={() => addItem(image, 1)}
            >
              <BsBagPlus size={15} />
              Añadir al pedido
            </button>
          ) : (
            <div className="image-card__qty-control" aria-label="Cantidad en pedido">
              <button
                type="button"
                onClick={() => updateQuantity(image.id, quantityInCart - 1)}
                aria-label="Restar unidad"
              >
                -
              </button>
              <span>{quantityInCart} en pedido</span>
              <button
                type="button"
                onClick={() => updateQuantity(image.id, quantityInCart + 1)}
                aria-label="Sumar unidad"
              >
                +
              </button>
            </div>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="image-card__whatsapp-btn"
          >
            <BsWhatsapp className="image-card__whatsapp-icon" size={16} />
            Pedir directo
          </a>
        </div>
      </div>
    </div>
  );
}

