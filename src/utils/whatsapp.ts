import { DEFAULT_PRICING, calculatePricingMetrics } from '@/config/pricing';

export interface OrderItem {
  id: number;
  alt: string;
  src: string;
  category?: string;
  subcategory?: string;
  quantity: number;
}

/**
 * Formats a numeric value as Venezuelan Bolivares.
 */
export function formatBs(value: number): string {
  return (
    value.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' Bs.'
  );
}

/**
 * Resolves a local relative image path to an absolute URL in the browser.
 */
export function getAbsoluteImageUrl(src: string): string {
  if (typeof window !== 'undefined' && src.startsWith('/')) {
    return `${window.location.origin}${src}`;
  }
  return src;
}

/**
 * Extracts a clean display title from an image's alt text / filename.
 */
export function getCleanTitle(alt: string): string {
  const trimmed = alt.trim();
  if (/^\d+$/.test(trimmed)) return '';
  if (/^whatsapp\s+image/i.test(trimmed)) return '';
  if (/^(img|image)[_\s-]*\d+/i.test(trimmed)) return '';

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
}

/**
 * Generates a short deterministic-style order reference code.
 */
export function generateOrderRef(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `YP-${hh}${mm}${ss}`;
}

/**
 * Generates a WhatsApp order URL for a single catalog item.
 */
export function buildSingleItemWhatsAppUrl(
  item: { alt: string; src: string },
  bcvRate: number | null | undefined,
  phoneNumber: string = DEFAULT_PRICING.whatsappNumber
): string {
  const { unitPriceUSD, wholesalePriceUSD, wholesaleMinUnits, discountPercent, promoActive } =
    calculatePricingMetrics();
  const title = getCleanTitle(item.alt);
  const imgUrl = getAbsoluteImageUrl(item.src);

  const modelLine = title ? `*Modelo:* ${title}` : `*Código:* ${item.alt}`;
  const unitBs = bcvRate ? ` (${formatBs(unitPriceUSD * bcvRate)})` : '';
  const wholesaleBs = bcvRate ? ` (${formatBs(wholesalePriceUSD * bcvRate)})` : '';

  const priceBlock = promoActive
    ? `*Precio unitario:* $${unitPriceUSD.toFixed(2)} USD${unitBs}\n*Oferta (${wholesaleMinUnits}+ uds - ${discountPercent}% OFF):* $${wholesalePriceUSD.toFixed(2)} c/u${wholesaleBs}`
    : `*Precio unitario:* $${unitPriceUSD.toFixed(2)} USD${unitBs}`;

  const message = `*YP MODAS — CONSULTA DE PRODUCTO*
--------------------------------
${modelLine}
${priceBlock}
--------------------------------
*Foto:* ${imgUrl}`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the structured plain-text receipt for WhatsApp and clipboard copy.
 */
export function buildWholesaleOrderText(
  items: OrderItem[],
  totalUnits: number,
  effectivePriceUSD: number,
  isWholesale: boolean,
  bcvRate: number | null | undefined,
  orderRef?: string
): string {
  const { unitPriceUSD, discountPercent, wholesaleMinUnits } = calculatePricingMetrics();
  const ref = orderRef || generateOrderRef();
  const dateStr = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const regularTotalUSD = totalUnits * unitPriceUSD;
  const totalUSD = totalUnits * effectivePriceUSD;
  const savingsUSD = regularTotalUSD - totalUSD;

  const unitBs = bcvRate ? ` (${formatBs(effectivePriceUSD * bcvRate)})` : '';
  const totalBsLine = bcvRate ? `\n*TOTAL BS (BCV):* ${formatBs(totalUSD * bcvRate)}` : '';
  const rateTag = isWholesale
    ? `Mayorista (${wholesaleMinUnits}+ uds - ${discountPercent}% OFF)`
    : 'Detal';

  const itemsList = items
    .map((item, idx) => {
      const title = getCleanTitle(item.alt) || item.alt;
      const lineTotal = (item.quantity * effectivePriceUSD).toFixed(2);
      const catInfo =
        item.category && item.subcategory ? `\n   _${item.category} • ${item.subcategory}_` : '';
      return `*${idx + 1}. ${title}*
   Cant: ${item.quantity} ud(s) x $${effectivePriceUSD.toFixed(2)} = *$${lineTotal}*${catInfo}
   Foto: ${getAbsoluteImageUrl(item.src)}`;
    })
    .join('\n\n');

  const savingsLine =
    isWholesale && savingsUSD > 0
      ? `\n*Ahorro aplicado:* -$${savingsUSD.toFixed(2)} USD`
      : '';

  return `*YP MODAS — NOTA DE PEDIDO*
Ref: #${ref} | Fecha: ${dateStr}
================================
*DETALLE DE ARTÍCULOS*

${itemsList}

================================
*RESUMEN DE PAGO*
*Unidades totales:* ${totalUnits}
*Tarifa:* ${rateTag}
*Precio unitario:* $${effectivePriceUSD.toFixed(2)} USD${unitBs}${savingsLine}
*TOTAL A PAGAR:* $${totalUSD.toFixed(2)} USD${totalBsLine}
================================`;
}

/**
 * Generates a consolidated WhatsApp order URL for all items accumulated in the cart.
 */
export function buildWholesaleOrderUrl(
  items: OrderItem[],
  totalUnits: number,
  effectivePriceUSD: number,
  isWholesale: boolean,
  bcvRate: number | null | undefined,
  phoneNumber: string = DEFAULT_PRICING.whatsappNumber,
  orderRef?: string
): string {
  const message = buildWholesaleOrderText(
    items,
    totalUnits,
    effectivePriceUSD,
    isWholesale,
    bcvRate,
    orderRef
  );

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
