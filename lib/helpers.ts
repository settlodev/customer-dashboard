import { ExtendedProduct } from "@/types/site/type";

export const DEFAULT_CURRENCY = "TZS";

export const getProductPrice = (product: ExtendedProduct): number => {
  // First try to get price from the first variant if available
  if (product.variants && product.variants.length > 0) {
    return parseFloat(product.variants[0].price as unknown as string) || 0;
  }
  // Fall back to product's price property
  return parseFloat(product.price as string) || 0;
};

export const getCategoryId = (category: string): string => {
  return category.toLowerCase().replace(/\s+/g, '-');
};

export const formatPrice = (
  price: number | null | undefined,
  currency: string | null | undefined = 'TZS',
): string => {
  if (price == null || Number.isNaN(price)) return '—';
  const code = (currency || 'TZS').toUpperCase();
  return `${price.toLocaleString()} ${code}`;
};

/**
 * Format a money value with a currency code. If an `original` audit payload is
 * passed (original currency + amount + rate), the output appends a subtitle
 * describing the source-currency reconciliation (e.g. `50,000 TZS · 25 USD @ 2000`).
 */
export const formatMoney = (
  amount: number | null | undefined,
  currency: string | null | undefined,
  original?: {
    currency?: string | null;
    amount?: number | null;
    rate?: number | null;
  },
): string => {
  if (amount == null || Number.isNaN(amount)) return '—';
  const code = (currency || 'TZS').toUpperCase();
  const base = `${amount.toLocaleString()} ${code}`;

  const originalCurrency = original?.currency ? original.currency.toUpperCase() : null;
  const hasOriginal =
    originalCurrency &&
    originalCurrency !== code &&
    original?.amount != null &&
    !Number.isNaN(original.amount);

  if (!hasOriginal) return base;

  const rate = original?.rate;
  const rateLabel =
    rate != null && !Number.isNaN(rate) && rate !== 1
      ? ` @ ${rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}`
      : '';
  return `${base} · ${original!.amount!.toLocaleString()} ${originalCurrency}${rateLabel}`;
};

export const scrollToCategory = (category: string): void => {
  const element = document.getElementById(getCategoryId(category));
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

export const getLocationIdFromUrl = (): string | null => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('locationId');
  }
  return null;
};

export const isMobileDevice = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768;
  }
  return false;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};