export interface PricingConfig {
  unitPriceUSD: number;
  wholesalePriceUSD: number;
  wholesaleMinUnits: number;
  promoActive: boolean;
  promoTitle: string;
  whatsappNumber: string;
}

export const DEFAULT_PRICING: PricingConfig = {
  unitPriceUSD: 2.0,
  wholesalePriceUSD: 1.5,
  wholesaleMinUnits: 12,
  promoActive: true,
  promoTitle: '25% de descuento a partir de 12 unidades',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '584146430116',
};

export interface PricingMetrics extends PricingConfig {
  discountPercent: number;
}

/**
 * Computes derived pricing metrics such as discount percentage from the central configuration.
 */
export function calculatePricingMetrics(config: PricingConfig = DEFAULT_PRICING): PricingMetrics {
  const discountPercent =
    config.unitPriceUSD > 0
      ? Math.round(((config.unitPriceUSD - config.wholesalePriceUSD) / config.unitPriceUSD) * 100)
      : 0;

  return {
    ...config,
    discountPercent,
  };
}

/**
 * Determines the effective unit price based on total units in an order.
 */
export function getEffectiveUnitPrice(
  totalUnits: number,
  config: PricingConfig = DEFAULT_PRICING
): { unitPriceUSD: number; isWholesale: boolean } {
  const isWholesale = config.promoActive && totalUnits >= config.wholesaleMinUnits;
  return {
    unitPriceUSD: isWholesale ? config.wholesalePriceUSD : config.unitPriceUSD,
    isWholesale,
  };
}

