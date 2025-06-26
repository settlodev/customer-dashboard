'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ShoppingCartIcon, X, Plus } from 'lucide-react';
import { BusinessType, CategorizedProducts, ExtendedProduct } from '@/types/site/type';
import { Button } from '../ui/button';

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
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);

  const getProductPrice = (product: ExtendedProduct) => {
    if (product.variants && product.variants.length > 0) {
      return parseFloat(product.variants[0].price as unknown as string) || 0;
    }
    return parseFloat(product.price as string) || 0;
  };

  // Flatten all products from all categories into a single array
  const allProducts = Object.values(categorizedProducts).flat();

  // Filter products by selected category if one is selected
  const displayProducts = selectedCategory && selectedCategory !== 'all'
    ? categorizedProducts[selectedCategory] || []
    : allProducts;

  const handleProductClick = (product: ExtendedProduct) => {
    // Only show modal if the product has a description
    if (product.description && product.description.trim()) {
      setSelectedProduct(product);
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const handleAddToCart = (product: ExtendedProduct, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent modal from opening when clicking add to cart
    }
    onAddToCart(product);
  };

  return (
    <div>
      {/* Products Grid - Single grid for all products */}
      <div className={`grid gap-4 ${
        displayProducts.length === 1 
          ? 'grid-cols-1 lg:grid-cols-2' 
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      }`}>
        {displayProducts.map(product => {
          const extendedProduct = product as ExtendedProduct;
          const hasDescription = product.description && product.description.trim();
          
          return (
            <Card 
              key={`${product.id}-${product.name}`} 
              className={`overflow-hidden group hover:shadow-lg transition-all duration-300 relative ${
                hasDescription ? 'cursor-pointer' : ''
              }`}
              onClick={() => handleProductClick(extendedProduct)}
            >
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
                
                {/* Description indicator */}
                {hasDescription && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    Info
                  </div>
                )}

                {/* Add to Cart Button - Floating */}
                <div className="absolute bottom-2 right-2">
                  <Button
                    size="sm"
                    onClick={(e) => handleAddToCart(extendedProduct, e)}
                    className={`${businessType.primary} hover:opacity-90 text-white rounded-full w-8 h-8 p-0 shadow-lg`}
                    title="Add to Cart"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <CardHeader className="p-3 pb-0">
                <h3 className="font-medium text-start truncate text-sm sm:text-base">{product.name}</h3>
              </CardHeader>
              
              <CardContent className="p-3 pt-2 text-center">
                <div className="flex items-start justify-start gap-2">
                  <p className="text-lg font-bold">
                   @ {getProductPrice(extendedProduct).toLocaleString()} <span className="text-xs font-normal text-gray-500">TZS</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold truncate pr-4">{selectedProduct.name}</h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {selectedProduct.image && (
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="mb-4">
                <p className="text-2xl font-bold">
                  @ {getProductPrice(selectedProduct).toLocaleString()} 
                  <span className="text-sm font-normal text-gray-500 ml-1">TZS</span>
                </p>
              </div>
              
              <div className='flex flex-col gap-2'>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedProduct.description}
                </p>

                <Button 
                  className={`mt-4 ${businessType.primary} hover:opacity-90 text-white rounded-md p-2`}
                  onClick={() => handleAddToCart(selectedProduct)}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;