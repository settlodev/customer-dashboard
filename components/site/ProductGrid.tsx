
'use client';
import React, { useState } from 'react';
import { Card, CardContent} from '@/components/ui/card';
import { 
  ShoppingCart, 
  ShoppingCartIcon, 
  Plus, 
  Eye,
  Zap,
  Tag
} from 'lucide-react';
import { BusinessType, CategorizedProducts, ExtendedProduct } from '@/types/site/type';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ProductGridProps {
  categorizedProducts: CategorizedProducts;
  selectedCategory: string | null;
  businessType: BusinessType;
  onAddToCart: (product: ExtendedProduct, quantity?: number, variantId?: string) => void;
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
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

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

 
  const allProducts = Object.values(categorizedProducts).flat();
  const displayProducts = selectedCategory && selectedCategory !== 'all'
    ? categorizedProducts[selectedCategory] || []
    : allProducts;

  const handleProductClick = (product: ExtendedProduct) => {
    const productData = encodeURIComponent(JSON.stringify(product));
    const productSlug = product.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') 
      .replace(/\s+/g, '-') 
      .replace(/-+/g, '-') 
      .trim();
    
    // Pass both the product data and ID (as fallback)
    router.push(`${basePath}/${product.id}?slug=${productSlug}&product=${productData}`);
  };

  const handleVariantChange = (productId: string, variantId: string) => {
    const newSelectedVariants = new Map(selectedVariants);
    newSelectedVariants.set(productId, variantId);
    setSelectedVariants(newSelectedVariants);
  };

 
  const handleAddToCart = async (product: ExtendedProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (product.variants && product.variants.length > 0) {
      let variantId = selectedVariants.get(product.id);
      
      if (!variantId && product.variants.length === 1) {
        variantId = product.variants[0].id;
        handleVariantChange(product.id, variantId);
      }
      
      if (!variantId && product.variants.length > 1) {
        handleProductClick(product);
        return;
      }
      
      setLoadingProducts(prev => new Set(prev).add(product.id));
      
      setTimeout(() => {
        onAddToCart(product, 1, variantId);
        setLoadingProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
      }, 300);
    } else {
      setLoadingProducts(prev => new Set(prev).add(product.id));
      
      setTimeout(() => {
        onAddToCart(product, 1);
        setLoadingProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
      }, 300);
    }
  };

  const hasVariants = (product: ExtendedProduct) => {
    return product.variants && product.variants.length > 0;
  };

  const needsVariantSelection = (product: ExtendedProduct) => {
    return hasVariants(product) && product.variants!.length > 1 && !selectedVariants.has(product.id);
  };

 
  return (
    <div className="px-2 sm:px-0">
      {/* Enhanced Products Grid */}
      <div className={`grid gap-4 sm:gap-6 ${
        displayProducts.length === 1 
          ? 'grid-cols-1 lg:grid-cols-2 max-w-4xl mx-auto' 
          : 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5'
      }`}>
        {displayProducts.map(product => {
          const extendedProduct = product as ExtendedProduct;
          const isLoading = loadingProducts.has(product.id);
          const productHasVariants = hasVariants(extendedProduct);
          const needsSelection = needsVariantSelection(extendedProduct);
          const isHovered = hoveredProduct === product.id;
         
          
          return (
            <Card 
              key={`${product.id}-${product.name}`} 
              className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/50 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1"
              onClick={() => handleProductClick(extendedProduct)}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
             
              <div className="relative overflow-hidden">
                {product.image ? (
                  <Image 
                    src={product.image} 
                    alt={product.name}
                    width={400}
                    height={300} 
                    className="w-full h-48 sm:h-52 object-cover transition-all duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-48 sm:h-52 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <ShoppingCartIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* Enhanced Overlay with Multiple Actions */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-all duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    <Button
                      onClick={(e) => handleAddToCart(extendedProduct, e)}
                      disabled={isLoading}
                      className={`flex-1 ${businessType.primary} hover:${businessType.accent} text-white rounded-xl font-semibold transform transition-all duration-300 ${
                        isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}
                      style={{ transitionDelay: '50ms' }}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {needsSelection ? <Eye className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                          {needsSelection ? 'View Options' : 'Add to Cart'}
                        </>
                      )}
                    </Button>
                    
                    {/* <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(extendedProduct);
                      }}
                      className={`p-3 bg-white/90 text-gray-800 hover:bg-white rounded-xl transform transition-all duration-300 ${
                        isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}
                      style={{ transitionDelay: '100ms' }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button> */}
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4 space-y-3">
                {/* Product Title */}
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 text-sm sm:text-base leading-tight group-hover:text-emerald-600 transition-colors duration-200">
                    {product.name}
                  </h3>
                </div>

            
                {/* Variant Information */}
                {productHasVariants && (
                  <div className="space-y-2">
                    {extendedProduct.variants!.length === 1 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <Tag className="w-3 h-3" />
                          {extendedProduct.variants![0].name || 'Default'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
                        <Zap className="w-3 h-3" />
                        {extendedProduct.variants!.length} options
                      </div>
                    )}
                  </div>
                )}

                {/* Price and Cart Action */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900">
                      {getDisplayPrice(extendedProduct).toLocaleString()}
                      <span className="text-sm font-normal text-gray-500 ml-1">TZS</span>
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleAddToCart(extendedProduct, e)}
                    disabled={isLoading}
                    className={`p-2 hover:${businessType.primary} hover:text-white transition-all duration-200 rounded-xl border border-gray-200 hover:border-transparent hover:shadow-md`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Product Description - Condensed */}
                {product.description && product.description.trim() && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}
              </CardContent>

              {/* Subtle glow effect on hover */}
              <div className={`absolute inset-0 rounded-lg transition-all duration-300 pointer-events-none ${
                isHovered ? 'ring-2 ring-emerald-200 ring-opacity-50' : ''
              }`} />
            </Card>
          );
        })}
      </div>

      {/* Enhanced Empty State */}
      {displayProducts.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <ShoppingCartIcon className="w-16 h-16 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-sm">0</span>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              No products found
            </h3>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              {selectedCategory 
                ? `We couldn't find any products in the "${selectedCategory}" category. Try browsing other categories or check back later.`
                : "No products match your current search criteria. Try adjusting your filters or browse our full catalog."
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/products')}
                className={`${businessType.primary} hover:${businessType.accent} text-white px-6 py-3 rounded-xl font-semibold`}
              >
                Browse All Products
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl font-semibold border-2 hover:bg-gray-50"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
