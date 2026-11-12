'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import FilterPanel from '@/components/FilterPanel';
import ImageCard from '@/components/ImageCard';
import OrderSummaryBar from '@/components/OrderSummaryBar';
import { useCart } from '@/context/CartContext';
import { calculatePricingMetrics } from '@/config/pricing';
import { buildSingleItemWhatsAppUrl, formatBs, getCleanTitle } from '@/utils/whatsapp';
import { BsWhatsapp, BsFire, BsLightningChargeFill, BsPercent, BsStars, BsBagPlus } from 'react-icons/bs';
import {
  catalogImages as fallbackImages,
  CATEGORIES,
  SUBCATEGORIES,
  CatalogImage,
} from '@/data/catalog';

// How many images to show per page load
const PAGE_SIZE = 24;

type Filters = {
  category: string;
  subcategory: string;
};

const DEFAULT_FILTERS: Filters = {
  category: 'Todos',
  subcategory: 'Todos',
};

export default function Home() {
  const { totalUnits, addItem, updateQuantity, getItemQuantity } = useCart();
  const pricing = calculatePricingMetrics();
  const [images, setImages] = useState<CatalogImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CatalogImage | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'category'>('recent');
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);

  // Close lightbox on Escape key press and toggle body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedImage]);

  // Fetch BCV exchange rate on mount
  useEffect(() => {
    async function fetchBcvRate() {
      setLoadingRate(true);
      try {
        const res = await fetch('/api/bcv');
        const data = await res.json();
        if (data && data.current && data.current.usd) {
          setBcvRate(data.current.usd);
        }
      } catch (error) {
        console.error('Error fetching BCV rate client side:', error);
      } finally {
        setLoadingRate(false);
      }
    }
    fetchBcvRate();
  }, []);

  // Fetch images from Cloudinary API on mount
  useEffect(() => {
    async function fetchImages() {
      setLoading(true);
      try {
        const res = await fetch('/api/images');
        const data = await res.json();
        if (data.images && data.images.length > 0) {
          setImages(data.images);
        } else {
          // If no images returned (e.g. credentials not set), use local fallback
          setImages(fallbackImages);
        }
      } catch (error) {
        console.error('Error fetching images from API:', error);
        setImages(fallbackImages);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  // Filter, search & sorting logic
  const filtered = useMemo<CatalogImage[]>(() => {
    const result = images.filter((img) => {
      const matchesCategory =
        filters.category === 'Todos' || img.category === filters.category;
      const matchesSubcategory =
        filters.subcategory === 'Todos' || img.subcategory === filters.subcategory;
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        img.alt.toLowerCase().includes(query) ||
        img.category.toLowerCase().includes(query) ||
        img.subcategory.toLowerCase().includes(query) ||
        img.tags.some((t) => t.toLowerCase().includes(query));

      return matchesCategory && matchesSubcategory && matchesSearch;
    });

    if (sortBy === 'recent') {
      return [...result].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return b.id - a.id;
      });
    } else if (sortBy === 'category') {
      return [...result].sort((a, b) => a.category.localeCompare(b.category));
    }

    return result;
  }, [images, filters, search, sortBy]);

  // Determine which images are "new" (e.g. the 6 most recent ones in the catalog)
  const recentImageIds = useMemo(() => {
    const sorted = [...images].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.id - a.id;
    });
    return new Set(sorted.slice(0, 6).map((img) => img.id));
  }, [images]);

  // Pagination
  const displayed = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = displayed.length < filtered.length;

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );

  const handleClear = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
    setPage(1);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  // Active filter tags
  const activeFilterTags = [
    filters.category !== 'Todos' && { key: 'category' as keyof Filters, label: filters.category },
    filters.subcategory !== 'Todos' && { key: 'subcategory' as keyof Filters, label: filters.subcategory },
    search && { key: null, label: `"${search}"` },
  ].filter(Boolean) as { key: keyof Filters | null; label: string }[];

  return (
    <>
      {/* ====== TOP PROMO BAR ====== */}
      {pricing.promoActive && (
        <div className="top-bar" role="region" aria-label="Oferta especial">
          <div className="top-bar__inner">
            <span className="top-bar__promo-pill">
              <BsFire size={13} />
              {pricing.discountPercent}% OFF
            </span>
            <span className="top-bar__promo-text">
              <BsStars className="top-bar__icon" size={15} />
              {pricing.discountPercent}% DE DESCUENTO A PARTIR DE {pricing.wholesaleMinUnits} UNIDADES: DE ${pricing.unitPriceUSD.toFixed(2)} A ${pricing.wholesalePriceUSD.toFixed(2)} C/U
              {bcvRate ? ` (${formatBs(pricing.wholesalePriceUSD * bcvRate)})` : ''}
              <BsLightningChargeFill className="top-bar__icon" size={14} />
            </span>
          </div>
        </div>
      )}

      {/* ====== HEADER ====== */}
      <header className="header">
        <div className="header__inner">
          {/* Brand */}
          <a href="/" className="header__brand">
            <img src="/logo.png" alt="YP Modas Logo" className="header__logo" />
            <div className="header__name">
              <span className="header__title">YP Modas</span>
              <span className="header__subtitle">Gorros Quirúrgicos</span>
            </div>
          </a>

          {/* Search */}
          <div className="header__search">
            <svg className="header__search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="search-input"
              type="search"
              className="header__search-input"
              placeholder="Buscar gorro, modelo, color o diseño..."
              value={search}
              onChange={handleSearch}
              aria-label="Buscar imágenes"
            />
          </div>

          {/* BCV Dollar Rate */}
          {bcvRate && (
            <span className="header__rate" title="Tasa oficial del Banco Central de Venezuela (BCV)">
              <span className="header__rate-label">Tasa BCV:</span> <strong>{formatBs(bcvRate)}</strong>
            </span>
          )}

          {/* WhatsApp Header CTA */}
          <a
            href="https://wa.me/584146430116?text=Hola%20YP%20Modas%2C%20quisiera%20consultar%20el%20cat%C3%A1logo%20de%20gorros%20quir%C3%BArgicos."
            target="_blank"
            rel="noopener noreferrer"
            className="header__cta"
            aria-label="Contactar por WhatsApp"
          >
            <BsWhatsapp size={18} />
            <span>WhatsApp</span>
          </a>
        </div>
      </header>

      {/* ====== HERO ====== */}
      <section className="hero">
        <div className="hero__bg" aria-hidden="true">
          <img src="/Hero.jpg" alt="" className="hero__bg-img" />
          <div className="hero__bg-overlay" />
          <div className="hero__bg-fade" />
        </div>
        <div className="hero__inner">
          <div className="hero__badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Colección Quirúrgica 2025
          </div>
          <h1 className="hero__title">
            Gorros <em>Quirúrgicos</em><br />de Alta Calidad
          </h1>
          <p className="hero__description">
            Explora nuestra colección de gorros para damas y caballeros.
            Cómodos, lavables y con diseños exclusivos para profesionales de la salud.
          </p>
          {pricing.promoActive && (
            <div className="hero__promo-banner">
              <span className="hero__promo-ribbon">
                <BsFire size={13} />
                OFERTA MAYORISTA EXCLUSIVA
                <BsLightningChargeFill size={13} />
              </span>
              <span className="hero__promo-highlight">
                <BsStars className="hero__promo-icon" size={20} />
                {pricing.discountPercent}% DE DESCUENTO A PARTIR DE {pricing.wholesaleMinUnits} UNIDADES
                <BsPercent className="hero__promo-icon" size={20} />
              </span>
              <div className="hero__promo-details">
                <span>De <span className="hero__promo-old-price">${pricing.unitPriceUSD.toFixed(2)} c/u</span> a</span>
                <span className="hero__promo-new-price">${pricing.wholesalePriceUSD.toFixed(2)} c/u</span>
                {bcvRate && (
                  <span className="hero__promo-bs">({formatBs(pricing.wholesalePriceUSD * bcvRate)})</span>
                )}
              </div>
            </div>
          )}
          <div className="hero__actions">
            <a
              href="https://wa.me/584146430116?text=Hola%20YP%20Modas%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20los%20gorros%20quir%C3%BArgicos."
              target="_blank"
              rel="noopener noreferrer"
              className="hero__cta"
              id="hero-cta-btn"
            >
              <BsWhatsapp size={20} />
              <span>Contactanos!</span>
            </a>
          </div>
        </div>
      </section>

      {/* ====== MAIN CONTENT ====== */}
      <main className="main">
        {/* Desktop Sidebar */}
        <aside className="sidebar">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={handleClear}
            images={images}
            categories={CATEGORIES}
            subcategoriesMap={SUBCATEGORIES}
          />
        </aside>

        {/* Mobile sidebar overlay */}
        <div
          className={`mobile-sidebar-overlay ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <div className={`mobile-sidebar ${mobileOpen ? 'open' : ''}`} role="dialog" aria-label="Filtros">
          <div className="mobile-sidebar__close">
            <span style={{ fontWeight: 700, color: 'var(--purple-deep)', fontSize: 15 }}>Filtros</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Cerrar filtros">✕</button>
          </div>
          <FilterPanel
            filters={filters}
            onFilterChange={(key, value) => { handleFilterChange(key, value); setMobileOpen(false); }}
            onClear={() => { handleClear(); setMobileOpen(false); }}
            images={images}
            categories={CATEGORIES}
            subcategoriesMap={SUBCATEGORIES}
          />
        </div>

        {/* Catalog section */}
        <section className="catalog">
          {/* Toolbar */}
          <div className="catalog__toolbar">
            <div className="catalog__toolbar-left">
              {/* Mobile filter button */}
              <button
                id="mobile-filter-btn"
                className="filter-mobile-toggle"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir filtros"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="10" y1="18" x2="14" y2="18" />
                </svg>
                <span>Filtros</span>
                {activeFilterTags.length > 0 && (
                  <span className="filter-mobile-toggle__badge">
                    {activeFilterTags.length}
                  </span>
                )}
              </button>

              <p className="catalog__info">
                {loading ? (
                  <span>Cargando catálogo...</span>
                ) : (
                  <span>
                    Mostrando <strong>{displayed.length}</strong> de <strong>{filtered.length}</strong> gorros
                  </span>
                )}
              </p>
            </div>

            <div className="catalog__sort">
              <span className="catalog__sort-label">Ordenar:</span>
              <select
                id="sort-select"
                className="catalog__sort-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'recent' | 'category');
                  setPage(1);
                }}
                aria-label="Ordenar por"
              >
                <option value="recent">Más recientes</option>
                <option value="category">Por categoría</option>
              </select>
            </div>
          </div>

          {/* Active filter tags */}
          {activeFilterTags.length > 0 && (
            <div className="active-filters" role="list" aria-label="Filtros activos">
              {activeFilterTags.map((tag, i) => (
                <span key={i} className="active-filter-tag" role="listitem">
                  {tag.label}
                  <button
                    onClick={() => {
                      if (tag.key) {
                        handleFilterChange(tag.key, 'Todos');
                      } else {
                        setSearch('');
                      }
                    }}
                    aria-label={`Quitar filtro ${tag.label}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Image Grid */}
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="image-grid" aria-label="Cargando gorros">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="image-skeleton"
                  style={{ height: 280, borderRadius: 'var(--radius-md)', marginBottom: 16 }}
                />
              ))}
            </div>
          ) : displayed.length > 0 ? (
            <>
              <div className="image-grid" role="list" aria-label="Catálogo de gorros">
                {displayed.map((img, idx) => (
                  <div key={img.id} role="listitem">
                    <ImageCard
                      image={img}
                      priority={idx < 8}
                      onOpenLightbox={setSelectedImage}
                      isNew={recentImageIds.has(img.id)}
                      bcvRate={bcvRate}
                    />
                  </div>
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="load-more">
                  <button
                    id="load-more-btn"
                    className="load-more__btn"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Ver más gorros ({filtered.length - displayed.length} restantes)
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="empty-state">
              <span className="empty-state__icon">🪡</span>
              <h2 className="empty-state__title">No encontramos resultados</h2>
              <p className="empty-state__text">
                Intenta con otros filtros o términos de búsqueda.
              </p>
              <button className="empty-state__btn" onClick={handleClear}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                </svg>
                Ver todos los gorros
              </button>
            </div>
          )}
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="footer">
        <div className="footer__divider" />
        <p>© 2025 <strong>YP Modas</strong></p>
        <p style={{ marginTop: 6, fontSize: 13 }}>
        </p>
        <p style={{ marginTop: 4, fontSize: 12 }}>Todos los derechos reservados</p>
      </footer>

      {/* ====== LIGHTBOX MODAL ====== */}
      {selectedImage && (() => {
        const titleToDisplay = getCleanTitle(selectedImage.alt);
        const waUrl = buildSingleItemWhatsAppUrl(selectedImage, bcvRate, pricing.whatsappNumber);
        const qtyInCart = getItemQuantity(selectedImage.id);

        return (
          <div
            className="lightbox"
            onClick={() => setSelectedImage(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Vista detallada del gorro"
          >
            <div className="lightbox__card" onClick={(e) => e.stopPropagation()}>
              <button
                className="lightbox__close-btn"
                onClick={() => setSelectedImage(null)}
                aria-label="Cerrar vista completa"
              >
                ✕
              </button>

              <div className="lightbox__image-container">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="lightbox__img"
                />
              </div>

              <div className="lightbox__info-panel">
                <div>
                  <span className="lightbox__category">
                    {selectedImage.category} • {selectedImage.subcategory}
                  </span>
                  <h2 className="lightbox__title">
                    {titleToDisplay || 'Gorro Quirúrgico'}
                  </h2>
                </div>

                <div className="lightbox__divider" />

                <div className="lightbox__details">
                  {selectedImage.pattern && selectedImage.pattern !== 'Liso' && (
                    <p className="lightbox__detail-item">
                      <strong>Diseño/Estampado:</strong> {selectedImage.pattern}
                    </p>
                  )}
                  <p className="lightbox__detail-item">
                    Disponibilidad inmediata para entrega. Confeccionado con telas suaves y resistentes, ideal para profesionales de la salud.
                  </p>
                </div>

                {/* Price display in Lightbox */}
                <div className="lightbox__price-container">
                  <div className="lightbox__price-tier">
                    <span className="lightbox__price-label">Precio Unitario:</span>
                    <div className="lightbox__price-values">
                      <span className="lightbox__price-usd">${pricing.unitPriceUSD.toFixed(2)} USD c/u</span>
                      {bcvRate && (
                        <span className="lightbox__price-bs">({formatBs(pricing.unitPriceUSD * bcvRate)})</span>
                      )}
                    </div>
                  </div>
                  {pricing.promoActive && (
                    <div className="lightbox__price-tier lightbox__price-tier--wholesale">
                      <div className="lightbox__wholesale-header">
                        <span className="lightbox__price-label">
                          <BsFire size={15} />
                          {pricing.discountPercent}% de descuento a partir de {pricing.wholesaleMinUnits} unidades:
                        </span>
                        <span className="lightbox__discount-badge">
                          <BsLightningChargeFill size={11} />
                          -{pricing.discountPercent}% OFF
                        </span>
                      </div>
                      <div className="lightbox__price-values">
                        <span className="lightbox__price-usd lightbox__price-usd--promo">
                          ${pricing.wholesalePriceUSD.toFixed(2)} USD c/u
                        </span>
                        {bcvRate && (
                          <span className="lightbox__price-bs">
                            ({formatBs(pricing.wholesalePriceUSD * bcvRate)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lightbox__actions">
                  {qtyInCart === 0 ? (
                    <button
                      type="button"
                      className="lightbox__cart-btn"
                      onClick={() => addItem(selectedImage, 1)}
                    >
                      <BsBagPlus size={18} />
                      Añadir al pedido
                    </button>
                  ) : (
                    <div className="lightbox__qty-control">
                      <button
                        type="button"
                        onClick={() => updateQuantity(selectedImage.id, qtyInCart - 1)}
                        aria-label="Restar unidad"
                      >
                        -
                      </button>
                      <span>{qtyInCart} en pedido</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(selectedImage.id, qtyInCart + 1)}
                        aria-label="Sumar unidad"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lightbox__whatsapp-btn"
                  >
                    <BsWhatsapp className="lightbox__whatsapp-icon" size={18} style={{ marginRight: 8 }} />
                    Pedir por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====== ORDER SUMMARY BAR ====== */}
      <OrderSummaryBar bcvRate={bcvRate} />

      {/* ====== FLOATING WHATSAPP CTA ====== */}
      <a
        href={`https://wa.me/${pricing.whatsappNumber}?text=Hola%20YP%20Modas%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20los%20gorros%20quir%C3%BArgicos.`}
        target="_blank"
        rel="noopener noreferrer"
        className={`floating-whatsapp ${totalUnits > 0 ? 'floating-whatsapp--shifted' : ''}`}
        aria-label="Contactar por WhatsApp al +58 414-6430116"
        id="floating-whatsapp-btn"
      >
        <BsWhatsapp size={30} />
      </a>
    </>
  );
}
