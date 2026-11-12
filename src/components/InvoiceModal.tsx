'use client';

import React, { useState, useMemo } from 'react';
import {
  BsWhatsapp,
  BsPrinter,
  BsDownload,
  BsClipboard,
  BsCheck2,
  BsX,
  BsFire,
} from 'react-icons/bs';
import { CartItem } from '@/context/CartContext';
import { calculatePricingMetrics } from '@/config/pricing';
import {
  buildWholesaleOrderText,
  buildWholesaleOrderUrl,
  formatBs,
  generateOrderRef,
  getCleanTitle,
} from '@/utils/whatsapp';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalUnits: number;
  effectiveUnitPriceUSD: number;
  subtotalUSD: number;
  isWholesale: boolean;
  bcvRate: number | null;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  items,
  totalUnits,
  effectiveUnitPriceUSD,
  subtotalUSD,
  isWholesale,
  bcvRate,
}: InvoiceModalProps) {
  const [copied, setCopied] = useState(false);

  const orderRef = useMemo(() => (isOpen ? generateOrderRef() : ''), [isOpen]);

  if (!isOpen) return null;

  const { unitPriceUSD, discountPercent, whatsappNumber } = calculatePricingMetrics();
  const regularTotalUSD = totalUnits * unitPriceUSD;
  const savingsUSD = Math.max(0, regularTotalUSD - subtotalUSD);

  const dateStr = new Date().toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const waUrl = buildWholesaleOrderUrl(
    items,
    totalUnits,
    effectiveUnitPriceUSD,
    isWholesale,
    bcvRate,
    whatsappNumber,
    orderRef
  );

  const handleCopyText = async () => {
    try {
      const text = buildWholesaleOrderText(
        items,
        totalUnits,
        effectiveUnitPriceUSD,
        isWholesale,
        bcvRate,
        orderRef
      );
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    const width = 760;
    const rowHeight = 46;
    const baseHeight = 430;
    const height = baseHeight + items.length * rowHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Header banner
    ctx.fillStyle = '#240E35';
    ctx.fillRect(0, 0, width, 110);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('YP MODAS', 36, 48);

    ctx.fillStyle = '#FFF3B0';
    ctx.font = '600 13px sans-serif';
    ctx.fillText('GORROS QUIRÚRGICOS • NOTA DE PEDIDO DIGITAL', 36, 72);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Ref: #${orderRef}`, width - 36, 46);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#E8DFF0';
    ctx.fillText(dateStr, width - 36, 68);
    if (bcvRate) {
      ctx.fillText(`Tasa BCV: ${formatBs(bcvRate)}`, width - 36, 88);
    }
    ctx.textAlign = 'left';

    // Table header
    let y = 145;
    ctx.fillStyle = '#F2EDE8';
    ctx.fillRect(36, y - 22, width - 72, 32);

    ctx.fillStyle = '#5C2E7A';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('#', 48, y);
    ctx.fillText('MODELO / DISEÑO', 80, y);
    ctx.textAlign = 'center';
    ctx.fillText('CANT.', 480, y);
    ctx.textAlign = 'right';
    ctx.fillText('P. UNIT', 585, y);
    ctx.fillText('SUBTOTAL', width - 48, y);
    ctx.textAlign = 'left';

    y += 32;

    // Rows
    items.forEach((item, index) => {
      const rawTitle = getCleanTitle(item.alt) || item.alt;
      const title = rawTitle.length > 42 ? rawTitle.slice(0, 39) + '...' : rawTitle;
      const lineTotal = (item.quantity * effectiveUnitPriceUSD).toFixed(2);

      ctx.fillStyle = '#2D1B35';
      ctx.font = '600 13px sans-serif';
      ctx.fillText(`${index + 1}`, 48, y);
      ctx.fillText(title, 80, y);

      ctx.textAlign = 'center';
      ctx.fillText(`${item.quantity}`, 480, y);

      ctx.textAlign = 'right';
      ctx.fillText(`$${effectiveUnitPriceUSD.toFixed(2)}`, 585, y);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`$${lineTotal}`, width - 48, y);
      ctx.textAlign = 'left';

      ctx.strokeStyle = '#E8DFF0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(36, y + 16);
      ctx.lineTo(width - 36, y + 16);
      ctx.stroke();

      y += rowHeight;
    });

    // Summary Box
    y += 16;
    ctx.fillStyle = isWholesale ? '#1B0928' : '#FBF8F5';
    ctx.fillRect(36, y, width - 72, 136);
    ctx.strokeStyle = isWholesale ? '#FFD700' : '#E8DFF0';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, y, width - 72, 136);

    const textColor = isWholesale ? '#FFF3B0' : '#5A4A62';
    const highlightColor = isWholesale ? '#FFD700' : '#5C2E7A';

    ctx.fillStyle = textColor;
    ctx.font = '600 13px sans-serif';
    ctx.fillText(`Total de unidades: ${totalUnits}`, 56, y + 32);
    ctx.fillText(
      `Tarifa aplicada: ${isWholesale ? `Mayorista (-${discountPercent}% OFF)` : 'Detal'}`,
      56,
      y + 56
    );
    if (isWholesale && savingsUSD > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`Ahorro mayorista: -$${savingsUSD.toFixed(2)} USD`, 56, y + 80);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = highlightColor;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`TOTAL: $${subtotalUSD.toFixed(2)} USD`, width - 56, y + 52);

    if (bcvRate) {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`Equivalente BCV: ${formatBs(subtotalUSD * bcvRate)}`, width - 56, y + 80);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = isWholesale ? '#FFD700' : '#9A8AA2';
    ctx.font = '12px sans-serif';
    ctx.fillText('WhatsApp: +58 414-6430116 • Catálogo Oficial YP Modas', width / 2, y + 118);

    const link = document.createElement('a');
    link.download = `nota-pedido-${orderRef}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      className="invoice-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Factura digital de pedido"
    >
      <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="invoice-modal__close"
          onClick={onClose}
          aria-label="Cerrar factura"
        >
          <BsX size={22} />
        </button>

        {/* Printable Document Area */}
        <div className="invoice-printable">
          <div className="invoice-doc__header">
            <div className="invoice-doc__brand">
              <img src="/logo.png" alt="YP Modas" className="invoice-doc__logo" />
              <div>
                <h2 className="invoice-doc__title">YP Modas</h2>
                <p className="invoice-doc__subtitle">Nota de Pedido Digital</p>
              </div>
            </div>
            <div className="invoice-doc__meta">
              <span className="invoice-doc__ref">Ref: #{orderRef}</span>
              <span>{dateStr}</span>
              {bcvRate && <span>Tasa BCV: {formatBs(bcvRate)}</span>}
            </div>
          </div>

          <div className="invoice-doc__table-wrap">
            <table className="invoice-doc__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Modelo / Diseño</th>
                  <th className="text-center">Cant.</th>
                  <th className="text-right">P. Unit</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const title = getCleanTitle(item.alt) || item.alt;
                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="invoice-doc__item-cell">
                          <img src={item.src} alt={title} className="invoice-doc__thumb" />
                          <div>
                            <div className="invoice-doc__item-name">{title}</div>
                            {item.category && (
                              <div className="invoice-doc__item-cat">
                                {item.category} • {item.subcategory}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">${effectiveUnitPriceUSD.toFixed(2)}</td>
                      <td className="text-right font-bold">
                        ${(item.quantity * effectiveUnitPriceUSD).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            className={`invoice-doc__summary ${isWholesale ? 'invoice-doc__summary--wholesale' : ''}`}
          >
            <div className="invoice-doc__summary-left">
              <div>
                <strong>Unidades totales:</strong> {totalUnits}
              </div>
              <div>
                <strong>Tarifa:</strong>{' '}
                {isWholesale ? (
                  <span className="invoice-doc__wholesale-tag">
                    <BsFire size={12} /> Mayorista (-{discountPercent}% OFF)
                  </span>
                ) : (
                  'Detal'
                )}
              </div>
              {isWholesale && savingsUSD > 0 && (
                <div className="invoice-doc__savings">
                  Ahorro aplicado: -${savingsUSD.toFixed(2)} USD
                </div>
              )}
            </div>

            <div className="invoice-doc__summary-right">
              <div className="invoice-doc__total-usd">${subtotalUSD.toFixed(2)} USD</div>
              {bcvRate && (
                <div className="invoice-doc__total-bs">{formatBs(subtotalUSD * bcvRate)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="invoice-modal__actions">
          <button
            type="button"
            className="invoice-btn invoice-btn--secondary"
            onClick={handleCopyText}
          >
            {copied ? <BsCheck2 size={16} /> : <BsClipboard size={15} />}
            <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
          </button>

          <button
            type="button"
            className="invoice-btn invoice-btn--secondary"
            onClick={handlePrintPdf}
          >
            <BsPrinter size={15} />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            className="invoice-btn invoice-btn--gold"
            onClick={handleDownloadPng}
          >
            <BsDownload size={15} />
            <span>Descargar Imagen</span>
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="invoice-btn invoice-btn--whatsapp"
          >
            <BsWhatsapp size={16} />
            <span>Enviar por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

