// components/ProductGrid.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCartIcon, Tag } from 'lucide-react';
import { BusinessType, CategorizedProducts, ExtendedProduct } from '@/types/site/type';

interface ProductGridProps {
  categorizedProducts: CategorizedProducts;
  selectedCategory: string | null;
  businessType: BusinessType;
  onAddToCart: (product: ExtendedProduct) => void;
  onAddToWishlist: (product: ExtendedProduct) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  categorizedProducts,
  selectedCategory,
  businessType,
  onAddToCart,
  onAddToWishlist
}) => {
  const getProductPrice = (product: ExtendedProduct) => {
    if (product.variants && product.variants.length > 0) {
      return parseFloat(product.variants[0].price as unknown as string) || 0;
    }
    return parseFloat(product.price as string) || 0;
  };

  return (
    <div>
      {Object.keys(categorizedProducts).map(category => (
        <div 
          key={category} 
          id={category.toLowerCase().replace(/\s+/g, '-')}
          className={`mb-12 ${selectedCategory === category ? 'scroll-mt-32' : ''}`}
        >
          {/* Category Header */}
          <div className={`rounded-lg p-3 mb-4 flex items-center gap-2 ${businessType.primary} text-white`}>
            <div className="flex-1">
              <h2 className="text-lg font-medium">{category}</h2>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categorizedProducts[category].map(product => {
              const extendedProduct = product as ExtendedProduct;
              return (
                <Card 
                  key={`${product.id}-${product.name}`} 
                  className="overflow-hidden group hover:shadow-lg transition-all duration-300 relative"
                >
                  {/* Wishlist Button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 bg-white rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onAddToWishlist(extendedProduct)}
                  >
                    <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
                  </Button>
                  
                  <div className="relative">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                        <ShoppingCartIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="p-3 pb-0">
                    <h3 className="font-medium text-center truncate text-sm sm:text-base">{product.name}</h3>
                  </CardHeader>
                  
                  <CardContent className="p-3 pt-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-lg font-bold">
                        {getProductPrice(extendedProduct).toLocaleString()} <span className="text-xs font-normal text-gray-500">TZS</span>
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-3 pt-0 justify-center flex flex-col gap-2">
                    <Badge variant="outline" className="px-2 py-1 text-xs w-full justify-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {extendedProduct.categoryName}
                    </Badge>
                    
                    <Button 
                      className={`w-full mt-1 ${businessType.primary} hover:opacity-90`}
                      size="sm"
                      onClick={() => onAddToCart(extendedProduct)}
                    >
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;