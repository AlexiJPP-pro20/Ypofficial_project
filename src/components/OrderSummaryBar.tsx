'use client';

import React, { useState } from 'react';
import {
  BsWhatsapp,
  BsTrash,
  BsChevronUp,
  BsChevronDown,
  BsLightningChargeFill,
  BsFire,
  BsFileEarmarkText,
} from 'react-icons/bs';
import { useCart } from '@/context/CartContext';
import { calculatePricingMetrics } from '@/config/pricing';
import { buildWholesaleOrderUrl, formatBs, getCleanTitle } from '@/utils/whatsapp';
import InvoiceModal from '@/components/InvoiceModal';

interface OrderSummaryBarProps {
  bcvRate: number | null;
}

export default function OrderSummaryBar({ bcvRate }: OrderSummaryBarProps) {
  const {
    items,
    totalUnits,
    isWholesale,
    effectiveUnitPriceUSD,
    subtotalUSD,
    unitsRemainingForWholesale,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [expanded, setExpanded] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  if (totalUnits === 0) return null;

  const { discountPercent, wholesalePriceUSD, whatsappNumber } = calculatePricingMetrics();
  const waUrl = buildWholesaleOrderUrl(
    items,
    totalUnits,
    effectiveUnitPriceUSD,
    isWholesale,
    bcvRate,
    whatsappNumber
  );

  return (
    <div
      className={`order-bar ${isWholesale ? 'order-bar--wholesale' : ''}`}
      role="region"
      aria-label="Resumen de pedido acumulado"
    >
      {/* Expandable Breakdown Drawer */}
      {expanded && (
        <div className="order-bar__drawer">
          <div className="order-bar__drawer-header">
            <span>Detalle del Pedido ({totalUnits} uds)</span>
            <button
              type="button"
              className="order-bar__clear-btn"
              onClick={() => {
                clearCart();
                setExpanded(false);
              }}
              aria-label="Vaciar pedido"
            >
              <BsTrash size={13} />
              Vaciar
            </button>
          </div>
          <ul className="order-bar__list">
            {items.map((item) => {
              const title = getCleanTitle(item.alt) || item.alt;
              return (
                <li key={item.id} className="order-bar__list-item">
                  <img src={item.src} alt={title} className="order-bar__thumb" />
                  <div className="order-bar__item-info">
                    <span className="order-bar__item-title">{title}</span>
                    <span className="order-bar__item-sub">
                      {item.category} • {item.subcategory}
                    </span>
                  </div>
                  <div className="order-bar__item-controls">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Disminuir cantidad de ${title}`}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Aumentar cantidad de ${title}`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="order-bar__remove-btn"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Eliminar ${title}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Main Sticky Summary Bar */}
      <div className="order-bar__inner">
        <div className="order-bar__left">
          <button
            type="button"
            className="order-bar__toggle-btn"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            <span className="order-bar__count-badge">{totalUnits}</span>
            <span className="order-bar__summary-text">
              {totalUnits === 1 ? '1 unidad' : `${totalUnits} unidades`}
            </span>
            {expanded ? <BsChevronDown size={14} /> : <BsChevronUp size={14} />}
          </button>

          <div className="order-bar__status">
            {isWholesale ? (
              <span className="order-bar__wholesale-pill">
                <BsFire size={12} />
                TARIFA MAYORISTA ACTIVADA (-{discountPercent}% OFF: ${wholesalePriceUSD.toFixed(2)} c/u)
              </span>
            ) : (
              <span className="order-bar__progress-text">
                <BsLightningChargeFill size={12} />
                Agrega {unitsRemainingForWholesale} ud{unitsRemainingForWholesale === 1 ? '' : 's'} más para {discountPercent}% OFF (${wholesalePriceUSD.toFixed(2)} c/u)
              </span>
            )}
          </div>
        </div>

        <div className="order-bar__right">
          <div className="order-bar__totals">
            <span className="order-bar__total-usd">${subtotalUSD.toFixed(2)} USD</span>
            {bcvRate && (
              <span className="order-bar__total-bs">{formatBs(subtotalUSD * bcvRate)}</span>
            )}
          </div>

          <button
            type="button"
            className="order-bar__invoice-btn"
            onClick={() => setInvoiceOpen(true)}
            aria-label="Ver factura digital"
          >
            <BsFileEarmarkText size={16} />
            <span>Factura Digital</span>
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="order-bar__cta"
          >
            <BsWhatsapp size={17} />
            <span>Enviar Pedido</span>
          </a>
        </div>
      </div>

      <InvoiceModal
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        items={items}
        totalUnits={totalUnits}
        effectiveUnitPriceUSD={effectiveUnitPriceUSD}
        subtotalUSD={subtotalUSD}
        isWholesale={isWholesale}
        bcvRate={bcvRate}
      />
    </div>
  );
}

