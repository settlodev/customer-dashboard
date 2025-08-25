'use client';

import React, { useState } from 'react';
import ProductDetailsPage from './ProductDetailsPage';
import CartSidebar from './cartSidebar';
import { useCart } from '@/context/cartContext';
import { businessTypes, ExtendedProduct } from '@/types/site/type';

interface ProductDetailsPageWrapperProps {
  product: ExtendedProduct;
}

const ProductDetailsPageWrapper: React.FC<ProductDetailsPageWrapperProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [businessType] = useState(businessTypes.default); 

  const handleAddToCart = (product: ExtendedProduct, quantity: number, variantId?: string) => {
    addToCart(product, quantity, variantId);
    
    // Show success feedback
    const productName = product.name.length > 20 
      ? product.name.substring(0, 20) + '...' 
      : product.name;
    
    // Create a temporary toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${businessType.primary} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
    toast.textContent = `Added ${productName} to cart`;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  };

  const handleAddToWishlist = (product: ExtendedProduct) => {
    // Implement wishlist functionality
    alert(`Added ${product.name} to wishlist`);
  };

  return (
    <>
      <ProductDetailsPage
        product={product}
        businessType={businessType}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
      />

    </>
  );
};

export default ProductDetailsPageWrapper;