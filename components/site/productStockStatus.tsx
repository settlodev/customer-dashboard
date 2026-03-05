import { ExtendedProduct } from "@/types/site/type";

export const getProductStockStatus = (product: ExtendedProduct): {
    status: 'in-stock' | 'out-of-stock';
    quantity: number;
    hasVariants: boolean;
    variantStockInfo?: {
      [variantId: string]: {
        status: 'in-stock' | 'out-of-stock';
        quantity: number;
      };
    };
  } => {
    // If product has variants, check variant stock instead of product-level quantity
    if (product.variants && product.variants.length > 0) {
      const variantStockInfo: { [variantId: string]: { status: 'in-stock' | 'out-of-stock'; quantity: number } } = {};
      let hasInStockVariant = false;
  
      product.variants.forEach(variant => {
        let variantStatus: 'in-stock' | 'out-of-stock' = 'out-of-stock';
        let variantQuantity = 0;
  
        // If trackingType is null, consider it always in stock
        if (variant.trackingType === null) {
          variantStatus = 'in-stock';
          variantQuantity = 0; // Unlimited stock
          hasInStockVariant = true;
        }
        // If availableStock is provided, check it
        else if (variant.availableStock !== null && variant.availableStock !== undefined) {
          variantQuantity = parseInt(variant.availableStock as unknown as string) || 0;
          variantStatus = variantQuantity > 0 ? 'in-stock' : 'out-of-stock';
          if (variantStatus === 'in-stock') hasInStockVariant = true;
        }
        // If no availableStock but trackingType is STOCK, check if variant is active
        else if (variant.trackingType === 'STOCK' && variant.status) {
          variantStatus = 'in-stock'; // Assume in stock if active but no stock data
          variantQuantity = 0;
          hasInStockVariant = true;
        }
  
        variantStockInfo[variant.id] = {
          status: variantStatus,
          quantity: variantQuantity
        };
      });
  
      return {
        status: hasInStockVariant ? 'in-stock' : 'out-of-stock',
        quantity: 0, // We don't have a total quantity for variants
        hasVariants: true,
        variantStockInfo
      };
    }
  
    // If product has explicit quantity (no variants)
    if (product.quantity !== null && product.quantity !== undefined) {
      const qty = parseInt(product.quantity as unknown as string) || 0;
      return {
        status: qty > 0 ? 'in-stock' : 'out-of-stock',
        quantity: qty,
        hasVariants: false
      };
    }
  
    // If no quantity info and no variants, check trackingType
    if (product.trackingType === null) {
      return {
        status: 'in-stock',
        quantity: 0,
        hasVariants: false
      };
    }
  
    // Default to out of stock
    return {
      status: 'out-of-stock',
      quantity: 0,
      hasVariants: false
    };
  };

