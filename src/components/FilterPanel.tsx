'use client';

import React from 'react';
import { CatalogImage } from '@/data/catalog';

type Filters = {
  category: string;
  subcategory: string;
};

type FilterPanelProps = {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClear: () => void;
  images: CatalogImage[];
  categories: string[];
  subcategoriesMap: Record<string, string[]>;
};

function getCount(
  images: CatalogImage[],
  key: keyof CatalogImage,
  value: string,
  currentFilters: Filters
): number {
  if (value === 'Todos' || value === 'Todas') {
    if (key === 'category') {
      return images.filter(img => img.category === value || value === 'Todos').length;
    }
    if (key === 'subcategory') {
      return images.filter(
        (img) =>
          (img.subcategory === value) &&
          (currentFilters.category === 'Todos' || img.category === currentFilters.category)
      ).length;
    }
    return images.filter((img) => img[key] === value).length;
  }

  return images.filter((img) => {
    if (key === 'subcategory') {
      const matchCat = currentFilters.category === 'Todos' || img.category === currentFilters.category;
      return img.subcategory === value && matchCat;
    }
    return img[key] === value;
  }).length;
}

export default function FilterPanel({
  filters,
  onFilterChange,
  onClear,
  images,
  categories,
  subcategoriesMap,
}: FilterPanelProps) {
  const hasActiveFilters =
    filters.category !== 'Todos' ||
    filters.subcategory !== 'Todos';

  // Get active subcategories based on current category selection
  const availableSubcategories = subcategoriesMap[filters.category] || subcategoriesMap['Todos'];

  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <span className="filter-panel__title">Filtros</span>
        {hasActiveFilters && (
          <button className="filter-panel__clear" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>

      {/* Category */}
      <div className="filter-section">
        <div className="filter-section__label">Categoría</div>
        <div className="filter-options">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-option ${filters.category === cat ? 'active' : ''}`}
              onClick={() => {
                onFilterChange('category', cat);
                // Reset subcategory if it is no longer available in the new category
                const nextSubs = subcategoriesMap[cat] || [];
                if (!nextSubs.includes(filters.subcategory)) {
                  onFilterChange('subcategory', 'Todos');
                }
              }}
            >
              <span className="filter-option__dot" />
              <span className="filter-option__name">{cat}</span>
              <span className="filter-option__count">
                {images.filter(img => cat === 'Todos' || img.category === cat).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory */}
      <div className="filter-section">
        <div className="filter-section__label">Modelo / Tipo</div>
        <div className="filter-options">
          {availableSubcategories.map((sub) => (
            <button
              key={sub}
              className={`filter-option ${filters.subcategory === sub ? 'active' : ''}`}
              onClick={() => onFilterChange('subcategory', sub)}
            >
              <span className="filter-option__dot" />
              <span className="filter-option__name">{sub}</span>
              <span className="filter-option__count">
                {getCount(images, 'subcategory', sub, filters)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
