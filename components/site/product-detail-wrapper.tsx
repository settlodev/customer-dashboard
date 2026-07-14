"use client";
import React, { useState, useEffect } from "react";
import ProductDetailsPage from "./ProductDetailsPage";
import CartSidebar from "./cartSidebar";
import { useCart } from "@/context/cartContext";
import { businessTypes, ExtendedProduct } from "@/types/site/type";

interface ProductDetailsPageWrapperProps {
  product: ExtendedProduct;
}

const ProductDetailsPageWrapper: React.FC<ProductDetailsPageWrapperProps> = ({
  product,
}) => {
  const { addToCart, toggleCart, setLocationId, state } = useCart();
  const [businessType] = useState(businessTypes.default);

  // Set locationId when component mounts (only if it's different)
  useEffect(() => {
    if (product.location && state.locationId !== product.location) {
      console.log("Setting locationId in wrapper:", product.location);
      setLocationId(product.location);
    }
  }, [product.location, state.locationId, setLocationId]);

  const handleAddToCart = (
    product: ExtendedProduct,
    quantity: number,
    variantId?: string,
  ) => {
    addToCart(product, quantity, variantId);

    // Open the cart sidebar after adding item
    toggleCart();

    // Show success feedback
    const productName =
      product.name.length > 20
        ? product.name.substring(0, 20) + "..."
        : product.name;

    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 ${businessType.primary} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
    toast.textContent = `Added ${productName} to cart`;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      toast.style.transform = "translateX(100%)";
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
      {/* CartSidebar with locationId */}
      <CartSidebar businessType={businessType} locationId={product.location} />
    </>
  );
};

export default ProductDetailsPageWrapper;
