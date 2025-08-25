
'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ShoppingCart, ShoppingCartIcon, Plus } from 'lucide-react';
import { BusinessType, CategorizedProducts, ExtendedProduct } from '@/types/site/type';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ProductGridProps {
  categorizedProducts: CategorizedProducts;
  selectedCategory: string | null;
  businessType: BusinessType;
  onAddToCart: (product: ExtendedProduct, quantity?: number, variantId?: string) => void;
  onAddToWishlist: (product: ExtendedProduct) => void;
  // Optional prop for custom routing
  basePath?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  categorizedProducts,
  selectedCategory,
  businessType,
  onAddToCart,
  basePath = '/item'
}) => {
  const router = useRouter();
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());
  const [selectedVariants, setSelectedVariants] = useState<Map<string, string>>(new Map());

  const getProductPrice = (product: ExtendedProduct, variantId?: string) => {
    if (variantId && product.variants) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        return parseFloat(variant.price as unknown as string) || 0;
      }
    }
    
    if (product.variants && product.variants.length > 0) {
      return parseFloat(product.variants[0].price as unknown as string) || 0;
    }
    
    return parseFloat(product.price as string) || 0;
  };

  const getDisplayPrice = (product: ExtendedProduct) => {
    const selectedVariantId = selectedVariants.get(product.id);
    return getProductPrice(product, selectedVariantId);
  };

  // Flatten all products from all categories into a single array
  const allProducts = Object.values(categorizedProducts).flat();

  // Filter products by selected category if one is selected
  const displayProducts = selectedCategory && selectedCategory !== 'all'
    ? categorizedProducts[selectedCategory] || []
    : allProducts;

  const handleProductClick = (product: ExtendedProduct) => {
    // Always navigate to product details page when product is clicked
    const productSlug = product.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') 
      .replace(/-+/g, '-') 
      .trim();
    
    router.push(`${basePath}/${product.id}?slug=${productSlug}`);
  };

  const handleVariantChange = (productId: string, variantId: string) => {
    const newSelectedVariants = new Map(selectedVariants);
    newSelectedVariants.set(productId, variantId);
    setSelectedVariants(newSelectedVariants);
  };

  const handleAddToCart = async (product: ExtendedProduct, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    
    // Check if product has variants
    if (product.variants && product.variants.length > 0) {
      let variantId = selectedVariants.get(product.id);
      
      // If no variant selected and there's only one variant, auto-select it
      if (!variantId && product.variants.length === 1) {
        variantId = product.variants[0].id;
        handleVariantChange(product.id, variantId);
      }
      
      // If no variant selected and multiple variants exist, navigate to product page
      if (!variantId && product.variants.length > 1) {
        handleProductClick(product);
        return;
      }
      
      // Add loading state
      setLoadingProducts(prev => new Set(prev).add(product.id));
      
      // Simulate a small delay for better UX
      setTimeout(() => {
        onAddToCart(product, 1, variantId);
        setLoadingProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
      }, 200);
    } else {
      // Product has no variants, add directly
      setLoadingProducts(prev => new Set(prev).add(product.id));
      
      setTimeout(() => {
        onAddToCart(product, 1);
        setLoadingProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
      }, 200);
    }
  };

  const hasVariants = (product: ExtendedProduct) => {
    return product.variants && product.variants.length > 0;
  };

  const needsVariantSelection = (product: ExtendedProduct) => {
    return hasVariants(product) && product.variants!.length > 1 && !selectedVariants.has(product.id);
  };

  return (
    <div>
      {/* Products Grid */}
      <div className={`grid gap-4 ${
        displayProducts.length === 1 
          ? 'grid-cols-1 lg:grid-cols-2' 
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      }`}>
        {displayProducts.map(product => {
          const extendedProduct = product as ExtendedProduct;
          const isLoading = loadingProducts.has(product.id);
          const productHasVariants = hasVariants(extendedProduct);
          const needsSelection = needsVariantSelection(extendedProduct);
          
          return (
            <Card 
              key={`${product.id}-${product.name}`} 
              className="overflow-hidden group hover:shadow-lg transition-all duration-300 relative cursor-pointer"
              onClick={() => handleProductClick(extendedProduct)}
            >
              <div className="relative">
                {product.image ? (
                  <Image 
                    src={product.image} 
                    alt={product.name}
                    width={500}
                    height={500} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                    <ShoppingCartIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                
                

                {/* Quick Add to Cart Button - Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    onClick={(e) => handleAddToCart(extendedProduct, e)}
                    disabled={isLoading}
                    className={`${businessType.primary} hover:${businessType.accent} text-white px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {needsSelection ? 'View Options' : 'Quick Add'}
                  </Button>
                </div>
              </div>
              
              <CardHeader className="p-3 pb-0">
                <h3 className="font-medium text-start truncate text-sm sm:text-base">{product.name}</h3>
              </CardHeader>
              
              <CardContent className="p-3 pt-2">
                {/* Single Variant Selection (only for products with single variant) */}
                {productHasVariants && extendedProduct.variants!.length === 1 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      {extendedProduct.variants![0].name || 'Default variant'}
                    </div>
                  </div>
                )}

                {/* Multiple Variants Indicator */}
                {productHasVariants && extendedProduct.variants!.length > 1 && (
                  <div className="mb-3">
                    <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      {extendedProduct.variants!.length} options available
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold">
                      @ {getDisplayPrice(extendedProduct).toLocaleString()} 
                      <span className="text-xs font-normal text-gray-500 ml-1">TZS</span>
                    </p>
                   
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleAddToCart(extendedProduct, e)}
                    disabled={isLoading}
                    className={`p-2 hover:${businessType.primary} hover:text-white transition-colors`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {displayProducts.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
          <p className="text-gray-500">
            {selectedCategory 
              ? `No products available in "${selectedCategory}" category.`
              : "No products match your search criteria."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;