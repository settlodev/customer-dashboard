
// 'use client';
// import React, { useState, useEffect } from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { 
//   ArrowLeft, 
//   ShoppingCart, 
// //   Heart, 
// //   Share2, 
//   Plus, 
//   Minus,
//   Star,
//   ShoppingCartIcon,
//   Check
// } from 'lucide-react';
// import Image from 'next/image';
// import { useRouter } from 'next/navigation';
// import { BusinessType, ExtendedProduct } from '@/types/site/type';

// interface ProductDetailsPageProps {
//   product: ExtendedProduct;
//   businessType: BusinessType;
//   onAddToCart: (product: ExtendedProduct, quantity: number, variantId?: string) => void;
//   onAddToWishlist: (product: ExtendedProduct) => void;
//   relatedProducts?: ExtendedProduct[];
//   backPath?: string;
// }

// const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
//   product,
//   businessType,
//   onAddToCart,
//   onAddToWishlist,
//   relatedProducts = [],
//   backPath = '/products'
// }) => {
//   const router = useRouter();
//   const [selectedVariantId, setSelectedVariantId] = useState<string>('');
//   const [quantity, setQuantity] = useState(1);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isWishlisted, setIsWishlisted] = useState(false);

//   // Auto-select single variant or first variant
//   useEffect(() => {
//     if (product.variants && product.variants.length > 0) {
//       if (product.variants.length === 1) {
//         setSelectedVariantId(product.variants[0].id);
//       }
//     }
//   }, [product]);

//   const getProductPrice = (variantId?: string) => {
//     if (variantId && product.variants) {
//       const variant = product.variants.find(v => v.id === variantId);
//       if (variant) {
//         return parseFloat(variant.price as unknown as string) || 0;
//       }
//     }
    
//     if (product.variants && product.variants.length > 0) {
//       return parseFloat(product.variants[0].price as unknown as string) || 0;
//     }
    
//     return parseFloat(product.price as string) || 0;
//   };

//   const getCurrentPrice = () => getProductPrice(selectedVariantId);

//   const getSelectedVariant = () => {
//     if (selectedVariantId && product.variants) {
//       return product.variants.find(v => v.id === selectedVariantId);
//     }
//     return null;
//   };

//   const handleVariantSelect = (variantId: string) => {
//     setSelectedVariantId(variantId);
//   };

//   const handleAddToCart = async () => {
//     if (product.variants && product.variants.length > 1 && !selectedVariantId) {
//       alert('Please select a variant first');
//       return;
//     }

//     setIsLoading(true);
    
//     // Simulate loading
//     setTimeout(() => {
//       onAddToCart(product, quantity, selectedVariantId || undefined);
//       setIsLoading(false);
//     }, 500);
//   };

//   const handleAddToWishlist = () => {
//     onAddToWishlist(product);
//     setIsWishlisted(!isWishlisted);
//   };

//   const handleShare = async () => {
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: product.name,
//           text: `Check out this product: ${product.name}`,
//           url: window.location.href,
//         });
//       } catch (error) {
//         console.log('Error sharing:', error);
//       }
//     } else {
//       // Fallback to copying URL to clipboard
//       navigator.clipboard.writeText(window.location.href);
//       // You could show a toast notification here
//     }
//   };

//   const incrementQuantity = () => {
//     setQuantity(prev => prev + 1);
//   };

//   const decrementQuantity = () => {
//     setQuantity(prev => prev > 1 ? prev - 1 : 1);
//   };

//   const hasVariants = product.variants && product.variants.length > 0;
//   const needsVariantSelection = hasVariants && product.variants!.length > 1 && !selectedVariantId;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm sticky top-0 z-10">
//         <div className="max-w-7xl mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <Button
//               variant="ghost"
//               onClick={() => router.back()}
//               className="flex items-center gap-2"
//             >
//               {/* <ArrowLeft className="w-4 h-4" /> */}
//               {/* Back */}
//             </Button>
            
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleShare}
//                 className="p-2"
//               >
//                 {/* <Share2 className="w-4 h-4" /> */}
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleAddToWishlist}
//                 className={`p-2 ${isWishlisted ? 'text-red-500' : ''}`}
//               >
//                 {/* <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} /> */}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <div className="grid lg:grid-cols-2 gap-8">
//           {/* Product Image */}
//           <div className="space-y-4">
//             <Card className="overflow-hidden">
//               {product.image ? (
//                 <Image
//                   src={product.image}
//                   alt={product.name}
//                   width={600}
//                   height={600}
//                   className="w-full h-96 lg:h-[500px] object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-96 lg:h-[500px] bg-gray-100 flex items-center justify-center">
//                   <ShoppingCartIcon className="w-16 h-16 text-gray-300" />
//                 </div>
//               )}
//             </Card>
//           </div>

//           {/* Product Info */}
//           <div className="space-y-6">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
//               {/* Price */}
//               <div className="mb-4">
//                 <p className="text-xl font-bold text-gray-900">
//                    {getCurrentPrice().toLocaleString()}
//                   <span className="text-lg font-normal text-black ml-2">TZS</span>
//                 </p>
               
//               </div>

//               {/* Variant Selection - Grid Layout */}
//               {hasVariants && product.variants!.length > 1 && (
//                 <div className="mb-6">
//                   <label className="block text-sm font-medium text-gray-700 mb-3">
//                     Select Variant:
//                   </label>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                     {product.variants!.map((variant) => (
//                       <div
//                         key={variant.id}
//                         className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
//                           selectedVariantId === variant.id
//                             ? 'border-green-500 bg-blue-50 ring-2 ring-blue-200'
//                             : 'border-gray-200 hover:border-gray-300 bg-white'
//                         }`}
//                         onClick={() => handleVariantSelect(variant.id)}
//                       >
//                         {/* Selected indicator */}
//                         {selectedVariantId === variant.id && (
//                           <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
//                             <Check className="w-3 h-3" />
//                           </div>
//                         )}
                        
//                         <div className="space-y-1">
//                           <h3 className={`font-bold text-lg ${
//                             selectedVariantId === variant.id ? 'text-blue-900' : 'text-gray-900'
//                           }`}>
//                             {variant.name || `Variant ${variant.id.slice(0, 8)}`}
//                           </h3>
                          
//                           <div className="flex justify-between items-center">
//                             <span className={`text-sm font-bold ${
//                               selectedVariantId === variant.id ? 'text-blue-700' : 'text-gray-900'
//                             }`}>
//                               {parseFloat(variant.price as unknown as string).toLocaleString()}
//                             </span>
//                             <span className="text-xs text-gray-500">TZS</span>
//                           </div>
                          
//                           {/* Optional: Add variant description or attributes */}
//                           {variant.description && (
//                             <p className="text-xs text-gray-600 line-clamp-2">
//                               {variant.description}
//                             </p>
//                           )}
//                         </div>
                        
//                         {/* Hover effect overlay */}
//                         <div className={`absolute inset-0 rounded-lg transition-all duration-200 ${
//                           selectedVariantId === variant.id
//                             ? 'bg-blue-500/5'
//                             : 'bg-transparent hover:bg-gray-50'
//                         }`} />
//                       </div>
//                     ))}
//                   </div>
                  
//                   {/* Show selected variant info */}
//                   {selectedVariantId && (
//                     <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
//                       <div className="flex items-center gap-2">
//                         <Check className="w-4 h-4 text-green-600" />
//                         <span className="text-sm text-green-800">
//                           Selected: {getSelectedVariant()?.name || 'Default Variant'}
//                         </span>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Quantity Selector */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Quantity:
//                 </label>
//                 <div className="flex items-center gap-3">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={decrementQuantity}
//                     disabled={quantity <= 1}
//                     className="p-2"
//                   >
//                     <Minus className="w-4 h-4" />
//                   </Button>
//                   <span className="text-lg font-medium px-4">{quantity}</span>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={incrementQuantity}
//                     className="p-2"
//                   >
//                     <Plus className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>

//               {/* Add to Cart Button */}
//               <div className="mb-8">
//                 <Button
//                   onClick={handleAddToCart}
//                   disabled={isLoading || needsVariantSelection}
//                   className={`w-full py-3 text-lg font-medium ${
//                     needsVariantSelection ? 'opacity-50 cursor-not-allowed' : ''
//                   }`}
//                 >
//                   {isLoading ? (
//                     <div className="flex items-center justify-center gap-2">
//                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                       Adding to Cart...
//                     </div>
//                   ) : (
//                     <div className="flex items-center justify-center gap-2">
//                       <ShoppingCart className="w-5 h-5" />
//                       {needsVariantSelection ? 'Select Variant First' : `Add ${quantity} to Cart`}
//                     </div>
//                   )}
//                 </Button>
//               </div>
//             </div>

//             {/* Product Description */}
//             {product.description && product.description.trim() && (
//               <Card>
//                 <CardContent className="p-6">
//                   <h3 className="text-lg font-semibold mb-3">Product Description</h3>
//                   <div className="prose prose-sm max-w-none">
//                     <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
//                       {product.description}
//                     </p>
//                   </div>
//                 </CardContent>
//               </Card>
//             )}

//             {/* Selected Variant Info - Enhanced */}
//             {/* {selectedVariantId && getSelectedVariant() && (
//               <Card>
//                 <CardContent className="p-6">
//                   <h3 className="text-lg font-semibold mb-3">Selected Variant Details</h3>
//                   <div className="space-y-3">
//                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
//                       <div>
//                         <p className="font-medium">{getSelectedVariant()?.name || 'Default Variant'}</p>
//                         <p className="text-sm text-gray-600">Selected variant</p>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-lg font-bold text-blue-600">
//                           @ {getProductPrice(selectedVariantId).toLocaleString()} TZS
//                         </p>
//                         <p className="text-sm text-gray-500">Unit price</p>
//                       </div>
//                     </div>
                    
//                     <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
//                       <div>
//                         <p className="font-medium text-blue-900">Total ({quantity} items)</p>
//                         <p className="text-sm text-blue-700">Final amount</p>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-xl font-bold text-blue-800">
//                           @ {(getProductPrice(selectedVariantId) * quantity).toLocaleString()} TZS
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             )} */}
//           </div>
//         </div>

//         {/* Related Products */}
//         {relatedProducts.length > 0 && (
//           <div className="mt-12">
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
//             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
//               {relatedProducts.slice(0, 4).map((relatedProduct) => (
//                 <Card
//                   key={relatedProduct.id}
//                   className="cursor-pointer hover:shadow-lg transition-shadow"
//                   onClick={() => router.push(`/products/${relatedProduct.id}`)}
//                 >
//                   {relatedProduct.image ? (
//                     <Image
//                       src={relatedProduct.image}
//                       alt={relatedProduct.name}
//                       width={300}
//                       height={200}
//                       className="w-full h-32 object-cover"
//                     />
//                   ) : (
//                     <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
//                       <ShoppingCartIcon className="w-8 h-8 text-gray-300" />
//                     </div>
//                   )}
//                   <CardContent className="p-3">
//                     <h3 className="font-medium text-sm truncate">{relatedProduct.name}</h3>
//                     <p className="text-sm font-bold mt-1">
//                       @ {parseFloat(relatedProduct.price as string).toLocaleString()} TZS
//                     </p>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProductDetailsPage;

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
  Check
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BusinessType, ExtendedProduct } from '@/types/site/type';

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
  onAddToWishlist,
  relatedProducts = [],
  backPath = '/products'
}) => {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Auto-select single variant or first variant
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
    
    // Simulate loading
    setTimeout(() => {
      onAddToCart(product, quantity, selectedVariantId || undefined);
      setIsLoading(false);
    }, 500);
  };

  const handleAddToWishlist = () => {
    onAddToWishlist(product);
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
              ) : (
                <div className="w-full h-96 lg:h-[500px] bg-gray-100 flex items-center justify-center">
                  <ShoppingCartIcon className="w-16 h-16 text-gray-300" />
                </div>
              )}
            </Card>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {/* Price */}
              <div className="mb-4">
                <p className="text-xl font-bold text-gray-900">
                  @ {getCurrentPrice().toLocaleString()}
                  <span className="text-lg font-normal text-black ml-2">TZS</span>
                </p>
              </div>

              {/* Variant Selection - Grid Layout */}
              {hasVariants && product.variants!.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Variant:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.variants!.map((variant) => (
                      <div
                        key={variant.id}
                        className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedVariantId === variant.id
                            ? 'border-green-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => handleVariantSelect(variant.id)}
                      >
                        {/* Selected indicator */}
                        {selectedVariantId === variant.id && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          <h3 className={`font-bold text-lg ${
                            selectedVariantId === variant.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {variant.name || `Variant ${variant.id.slice(0, 8)}`}
                          </h3>
                          
                          <div className="flex justify-between items-center">
                            <span className={`text-sm font-bold ${
                              selectedVariantId === variant.id ? 'text-blue-700' : 'text-gray-900'
                            }`}>
                              @ {parseFloat(variant.price as unknown as string).toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500">TZS</span>
                          </div>
                          
                          {/* Optional: Add variant description or attributes */}
                          {variant.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {variant.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Hover effect overlay */}
                        <div className={`absolute inset-0 rounded-lg transition-all duration-200 ${
                          selectedVariantId === variant.id
                            ? 'bg-blue-500/5'
                            : 'bg-transparent hover:bg-gray-50'
                        }`} />
                      </div>
                    ))}
                  </div>
                  
                  {/* Show selected variant info */}
                  {selectedVariantId && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800">
                          Selected: {getSelectedVariant()?.name || 'Default Variant'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity:
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="p-2"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-medium px-4">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={incrementQuantity}
                    className="p-2"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="mb-8">
                <Button
                  onClick={handleAddToCart}
                  disabled={isLoading || needsVariantSelection}
                  className={`w-full py-3 text-lg font-medium ${businessType.primary} hover:${businessType.accent} text-white ${
                    needsVariantSelection ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding to Cart...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      {needsVariantSelection ? 'Select Variant First' : `Add ${quantity} to Cart`}
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Product Description */}
            {product.description && product.description.trim() && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Product Description</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/products/${relatedProduct.id}`)}
                >
                  {relatedProduct.image ? (
                    <Image
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      width={300}
                      height={200}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                      <ShoppingCartIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">{relatedProduct.name}</h3>
                    <p className="text-sm font-bold mt-1">
                      @ {parseFloat(relatedProduct.price as string).toLocaleString()} TZS
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;