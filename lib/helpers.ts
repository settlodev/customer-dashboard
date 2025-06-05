import { ExtendedProduct } from "@/types/site/type";

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

export const formatPrice = (price: number, currency: string = 'TZS'): string => {
  return `${price.toLocaleString()} ${currency}`;
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