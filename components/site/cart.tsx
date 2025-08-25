'use client';

import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { BusinessType } from '@/types/site/type';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cartContext';

interface CartPageProps {
  businessType?: BusinessType;
  locationId?: string;
}

const CartPage: React.FC<CartPageProps> = ({ 
  businessType = { 
    primary: 'bg-blue-600', 
    accent: 'bg-blue-700',
    secondary: 'bg-blue-100',
    text: 'text-blue-600'
  },
  locationId 
}) => {
  const { 
    state, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getTotalPrice 
  } = useCart();

  console.log("The state on this page is",state)

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const getProductPrice = (item: any) => {
    if (item.selectedVariantId && item.variants) {
      const variant = item.variants.find((v: any) => v.id === item.selectedVariantId);
      if (variant) {
        return parseFloat(variant.price as unknown as string) || 0;
      }
    }
    
    if (item.variants && item.variants.length > 0) {
      return parseFloat(item.variants[0].price as unknown as string) || 0;
    }
    
    return parseFloat(item.price as string) || 0;
  };

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
    } else {
      updateQuantity(cartItemId, newQuantity);
    }
  };

  const handleApplyPromoCode = async () => {
    setIsApplyingPromo(true);
    
    // Simulate API call for promo code validation
    setTimeout(() => {
      if (promoCode.toLowerCase() === 'save10') {
        setDiscount(0.1); // 10% discount
        alert('Promo code applied! 10% discount added.');
      } else if (promoCode.toLowerCase() === 'welcome5') {
        setDiscount(0.05); // 5% discount
        alert('Welcome promo applied! 5% discount added.');
      } else if (promoCode.trim()) {
        alert('Invalid promo code. Please try again.');
        setDiscount(0);
      }
      setIsApplyingPromo(false);
    }, 1000);
  };

  const subtotal = getTotalPrice();
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;
  const deliveryFee = subtotal > 50000 ? 0 : 5000; // Free delivery over 50,000 TZS
  const finalTotal = total + deliveryFee;

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/menu/${locationId || ''}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Your Cart</h1>
          </div>

          {/* Empty Cart */}
          <div className="text-center py-16">
            <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link href={`/menu/${locationId || ''}`}>
              <Button className={`${businessType.primary} hover:${businessType.accent} text-white px-8 py-3`}>
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/menu/${locationId || ''}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Your Cart ({state.itemCount} items)
            </h1>
            <Button 
              variant="outline" 
              onClick={clearCart}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Order Items</h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {state.items.map((item) => (
                    <div key={item.cartItemId} className="p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 flex-shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                              <ShoppingCart className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{item.name}</h3>
                              <p className="text-gray-600">
                                @ {getProductPrice(item).toLocaleString()} TZS each
                              </p>
                              {item.selectedVariant && (
                                <p className="text-sm text-gray-500">
                                  Variant: {item.selectedVariant.name}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.cartItemId)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Quantity and Total */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="font-medium min-w-[3rem] text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                @ {(getProductPrice(item) * item.quantity).toLocaleString()} TZS
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Promo Code */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Promo Code</h3>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleApplyPromoCode}
                    disabled={isApplyingPromo || !promoCode.trim()}
                  >
                    {isApplyingPromo ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
                {discount > 0 && (
                  <p className="text-green-600 text-sm mt-2">
                    Promo applied! {(discount * 100).toFixed(0)}% discount
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Order Summary</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>@ {subtotal.toLocaleString()} TZS</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({(discount * 100).toFixed(0)}%)</span>
                      <span>- @ {discountAmount.toLocaleString()} TZS</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `@ ${deliveryFee.toLocaleString()} TZS`
                      )}
                    </span>
                  </div>
                  
                  {subtotal > 0 && subtotal <= 50000 && (
                    <p className="text-sm text-gray-500">
                      Add @ {(50000 - subtotal).toLocaleString()} TZS more for free delivery
                    </p>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>@ {finalTotal.toLocaleString()} TZS</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <Link href="/checkout">
                    <Button 
                      className={`w-full ${businessType.primary} hover:${businessType.accent} text-white py-3`}
                    >
                      Proceed to Checkout
                    </Button>
                  </Link>
                  <Link href={`/menu/${locationId || ''}`}>
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Delivery Information</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Estimated delivery: 30-45 minutes</p>
                  <p>• Free delivery on orders over @ 50,000 TZS</p>
                  <p>• Contact us for any special instructions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;