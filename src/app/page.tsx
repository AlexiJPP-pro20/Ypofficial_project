'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import FilterPanel from '@/components/FilterPanel';
import ImageCard from '@/components/ImageCard';
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
  const [images, setImages] = useState<CatalogImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CatalogImage | null>(null);

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

  // Filter & search logic
  const filtered = useMemo<CatalogImage[]>(() => {
    return images.filter((img) => {
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
  }, [images, filters, search]);

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

          {/* Count */}
          <span className="header__count">
            <strong>{filtered.length}</strong> gorros
          </span>
        </div>
      </header>

      {/* ====== HERO ====== */}
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Colección Quirúrgica 2025
          </div>
          <h1 className="hero__title">
            Gorros <em>Quirúrgicos</em><br />de Alta Calidad
          </h1>
          <p className="hero__description">
            Explora nuestra colección de gorros para mujeres (moño y unisex) y hombres (unisex).
            Cómodos, lavables y con diseños exclusivos para profesionales de la salud.
          </p>
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
        <section style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div className="catalog__toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Mobile filter button */}
              <button
                id="mobile-filter-btn"
                className="filter-mobile-toggle"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir filtros"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="10" y1="18" x2="14" y2="18"/>
                </svg>
                Filtros
                {activeFilterTags.length > 0 && (
                  <span style={{
                    background: 'var(--purple-main)',
                    color: 'white',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}>
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
              <select id="sort-select" className="catalog__sort-select" defaultValue="default" aria-label="Ordenar por">
                <option value="default">Más recientes</option>
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
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
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
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
        <p>© 2025 <strong>YP Modas</strong> · Confeccionado con ❤️</p>
        <p style={{ marginTop: 4, fontSize: 12 }}>Todos los derechos reservados</p>
      </footer>

      {/* ====== LIGHTBOX MODAL ====== */}
      {selectedImage && (() => {
        const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '584262623818';
        const getImageUrl = (src: string) => {
          if (typeof window !== 'undefined' && src.startsWith('/')) {
            return `${window.location.origin}${src}`;
          }
          return src;
        };
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
        const titleToDisplay = getCleanTitle(selectedImage.alt);
        const imgUrl = getImageUrl(selectedImage.src);
        const modelLine = titleToDisplay 
          ? `- *Modelo:* ${titleToDisplay}` 
          : `- *Código:* ${selectedImage.alt}`;

        const message = `¡Hola Ypofficial! Quisiera pedir esta prenda de su catálogo:
${modelLine}
- *Foto:* ${imgUrl}`;

        const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

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

                <a 
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lightbox__whatsapp-btn"
                >
                  <svg
                    className="lightbox__whatsapp-icon"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.579 1.968 14.12 .94 11.5 1.056c-5.433 0-9.858 4.37-9.862 9.8.001 1.779.467 3.514 1.353 5.05L2.002 22l6.23-1.63c-1.554.856-3.18 1.484-1.585.784zm11.23-6.223c.302-.15.302-.45.051-.602-.251-.151-1.488-.732-1.718-.815-.23-.084-.397-.125-.565.125-.167.25-.646.815-.793.982-.147.166-.293.188-.595.037-.302-.15-1.274-.469-2.427-1.494-.897-.798-1.502-1.784-1.678-2.086-.176-.302-.019-.465.132-.615.136-.135.302-.35.453-.526.151-.176.201-.302.302-.503.101-.201.05-.377-.025-.526-.076-.15-1.02-2.464-1.397-3.37-.367-.887-.74-1.058-1.022-1.058-.282-.001-.565-.001-.847.001-.282 0-.74.106-1.127.525-.388.419-1.483 1.45-1.483 3.535 0 2.086 1.517 4.099 1.727 4.381.21.282 2.986 4.56 7.234 6.39.135.059.268.118.397.17.659.208 1.258.179 1.731.108.528-.079 1.62-.662 1.848-1.3.228-.638.228-1.186.16-1.3-.069-.113-.254-.18-.557-.33z" />
                  </svg>
                  Pedir por WhatsApp
                </a>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
