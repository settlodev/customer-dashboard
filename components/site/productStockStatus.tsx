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

        // Untracked (unlimited) variants are always in stock.
        if (variant.unlimited) {
          variantStatus = 'in-stock';
          variantQuantity = 0;
          hasInStockVariant = true;
        }
        // Tracked variants with a known available quantity.
        else if (variant.availableQuantity !== null && variant.availableQuantity !== undefined) {
          variantQuantity = parseInt(variant.availableQuantity as unknown as string) || 0;
          variantStatus = variantQuantity > 0 ? 'in-stock' : 'out-of-stock';
          if (variantStatus === 'in-stock') hasInStockVariant = true;
        }
        // Active variant with no quantity data — fall back to the inStock flag.
        else if (variant.active && variant.inStock) {
          variantStatus = 'in-stock';
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

    // No variants — when the product isn't tracking stock at all, treat as in-stock.
    if (!product.trackStock) {
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

