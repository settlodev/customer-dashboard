
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  ShoppingCartIcon,
  Check,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BusinessType, ExtendedProduct } from '@/types/site/type';
import CartSidebar from './cartSidebar';
import { useCart } from '@/context/cartContext';

interface ProductDetailsPageProps {
  product: ExtendedProduct;
  businessType: BusinessType;
  onAddToCart: (product: ExtendedProduct, quantity: number, variantId?: string) => void;
  onAddToWishlist: (product: ExtendedProduct) => void;
  relatedProducts?: ExtendedProduct[];
  backPath?: string;
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  businessType,
  onAddToCart,
  relatedProducts = [],
  backPath = '/products'
}) => {

  
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const { setLocationId } = useCart();

  
  useEffect(() => {
      setLocationId(product.location);
  }, []);

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      if (product.variants.length === 1) {
        setSelectedVariantId(product.variants[0].id);
      }
    }
  }, [product]);

  const getProductPrice = (variantId?: string) => {
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

  const getCurrentPrice = () => getProductPrice(selectedVariantId);

  const getSelectedVariant = () => {
    if (selectedVariantId && product.variants) {
      return product.variants.find(v => v.id === selectedVariantId);
    }
    return null;
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
  };

  const handleAddToCart = async () => {
    if (product.variants && product.variants.length > 1 && !selectedVariantId) {
      alert('Please select a variant first');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      onAddToCart(product, quantity, selectedVariantId || undefined);
      setIsLoading(false);
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
    }, 500);
  };


  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
  };

  const hasVariants = product.variants && product.variants.length > 0;
  const needsVariantSelection = hasVariants && product.variants!.length > 1 && !selectedVariantId;

 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Enhanced Header with Glass Effect */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-20 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-gray-100/50 transition-all duration-200 rounded-xl px-4 py-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Button>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Enhanced Product Images Section */}
          <div className="space-y-6">
            <Card className="overflow-hidden shadow-2xl ring-1 ring-gray-200/50 bg-white/50 backdrop-blur-sm">
              <div className="relative group">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={700}
                    height={700}
                    className="w-full h-64 sm:h-80 lg:h-96 xl:h-[500px] object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-64 sm:h-80 lg:h-96 xl:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <ShoppingCartIcon className="w-20 h-20 text-gray-400" />
                  </div>
                )}
                
                {/* Image overlay with quick actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-3">
                    <Button 
                      size="sm" 
                      className="bg-white/90 text-gray-800 hover:bg-white shadow-lg backdrop-blur-sm"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Quick View
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* Enhanced Product Info Section */}
          <div className="space-y-8">
            <Card className="p-6 lg:p-8 shadow-xl ring-1 ring-gray-200/50 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="space-y-6">
                  {/* Product Title & Rating */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                      {product.name}
                    </h1>
                    
                   
                  </div>

                  {/* Enhanced Price Display */}
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-2xl border border-emerald-200/50">
                    <div className="flex items-baseline gap-3">
                      <span className="text-xl lg:text-2xl font-bold text-gray-900">
                        {getCurrentPrice().toLocaleString()}
                      </span>
                      <span className="text-lg font-medium text-gray-600">TZS</span>
                    </div>
                    {needsVariantSelection && (
                      <p className="text-sm text-emerald-600 mt-1">
                        *Price may vary based on selected variant
                      </p>
                    )}
                  </div>

                  {/* Product Description */}
                  {product.description && product.description.trim() && (
                    <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200/50">
                      <h3 className="text-sm font-medium mb-3 text-gray-900 underline">
                        About this product
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {/* Enhanced Variant Selection */}
                  {hasVariants && product.variants!.length > 1 && (
                    <div>
                      <h3 className="text-sm font-medium mb-4 text-gray-900 underline">
                        Choose your option
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ">
                        {product.variants!.map((variant) => (
                          <div
                            key={variant.id}
                            className={`relative border-2 rounded-2xl items-center p-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                              selectedVariantId === variant.id
                                ? 'border-emerald-500 bg-emerald-50 shadow-lg ring-4 ring-emerald-200/50'
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                            }`}
                            onClick={() => handleVariantSelect(variant.id)}
                          >
                            {selectedVariantId === variant.id && (
                              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-2 shadow-lg">
                                <Check className="w-4 h-4" />
                              </div>
                            )}

                            <div className="space-y-2 ">
                              <h4 className={`font-bold text-sm ${
                                selectedVariantId === variant.id ? 'text-emerald-900' : 'text-gray-900'
                              }`}>
                                {variant.name || `Option ${variant.id.slice(0, 8)}`}
                              </h4>

                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-semibold ${
                                  selectedVariantId === variant.id ? 'text-emerald-700' : 'text-gray-900'
                                }`}>
                                  {parseFloat(variant.price as unknown as string).toLocaleString()}
                                  <span className="text-sm font-normal ml-1">TZS</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedVariantId && (
                        <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-emerald-600" />
                            <span className="font-medium text-emerald-800">
                              Selected: {getSelectedVariant()?.name || 'Default Option'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced Quantity & Add to Cart */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3 underline">
                        Quantity
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-50 rounded-xl border-2 border-gray-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                            className="p-3 hover:bg-gray-200 rounded-l-xl"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-bold px-4 py-2 min-w-[60px] text-center">
                            {quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={incrementQuantity}
                            className="p-3 hover:bg-gray-200 rounded-r-xl"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>Total: <span className="font-bold text-sm lg:text-lg text-gray-900">
                            {(getCurrentPrice() * quantity).toLocaleString()} {''}
                            <span className='text-sm font-bold lg:text-lg text-gray-900'>TZS</span>
                          </span></p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Add to Cart Button */}
                    <Button
                      onClick={handleAddToCart}
                      disabled={isLoading || needsVariantSelection}
                      className={`w-full py-4 text-lg font-bold rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl ${
                        isAddedToCart
                          ? 'bg-green-500 hover:bg-green-600'
                          : needsVariantSelection
                          ? 'bg-gray-400 cursor-not-allowed'
                          : `${businessType.primary} hover:${businessType.accent}`
                      } text-white`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          Adding to Cart...
                        </div>
                      ) : isAddedToCart ? (
                        <div className="flex items-center justify-center gap-3">
                          <Check className="w-6 h-6" />
                          Added to Cart!
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <ShoppingCart className="w-6 h-6" />
                          {needsVariantSelection ? 'Please select an option' : `Add ${quantity} to Cart`}
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                You might also like
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  className="group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl bg-white/70 backdrop-blur-sm ring-1 ring-gray-200/50"
                  onClick={() => router.push(`/products/${relatedProduct.id}`)}
                >
                  <div className="relative overflow-hidden">
                    {relatedProduct.image ? (
                      <Image
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <ShoppingCartIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-lg font-bold text-emerald-600">
                      {parseFloat(relatedProduct.price as string).toLocaleString()} 
                      <span className="text-sm font-normal text-gray-600 ml-1">TZS</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <CartSidebar 
      businessType={businessType}
      locationId={product.location}
       />
    </div>
  );
};

export default ProductDetailsPage;