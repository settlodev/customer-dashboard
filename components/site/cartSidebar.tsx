'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, Trash2, User, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessType, BusinessInfo } from '@/types/site/type';
import Image from 'next/image';
import { useCart } from '@/context/cartContext';
import { toast } from 'sonner';
import { submitOrderRequest } from '@/lib/actions/order-actions';

interface CartSidebarProps {
  businessType: BusinessType;
  businessInfo?: BusinessInfo;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ businessType }) => {
  const { 
    state, 
    updateQuantity, 
    removeFromCart, 
    toggleCart,
    updateItemComment,
    updateCustomerDetails,
    updateGlobalComment,
    getTotalPrice,
    clearCart
  } = useCart();

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

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

  const toggleCommentExpanded = (cartItemId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(cartItemId)) {
      newExpanded.delete(cartItemId);
    } else {
      newExpanded.add(cartItemId);
    }
    setExpandedComments(newExpanded);
  };

  const isFormValid = () => {
    const { customerDetails } = state;
    return customerDetails.firstName.trim() !== '' &&
           customerDetails.lastName.trim() !== '' &&
           customerDetails.phoneNumber.trim() !== '' &&
           customerDetails.gender !== '' &&
           customerDetails.emailAddress.trim() !== '';
  };

  const handleSubmitOrder = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all customer details');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitOrderRequest(state);
      if (result.success) {
        toast.success('Order request submitted successfully!');
        clearCart();
        toggleCart();
        setShowCustomerForm(false);
      } else {
        toast.error(result.error || 'Failed to submit order request');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Order submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = getTotalPrice();

  return (
    <>
      {/* Backdrop */}
      {state.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleCart}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        state.isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`${businessType.primary} text-white p-4 flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-lg font-semibold">
                Your Cart ({state.itemCount})
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {state.orderRequestitems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-4">Add some delicious items to get started!</p>
                <Button 
                  onClick={toggleCart}
                  className={`${businessType.primary} hover:${businessType.accent} text-white`}
                >
                  Continue Shopping
                </Button>
              </div>
            ) : !showCustomerForm ? (
              <div className="p-4 space-y-4">
                {/* Global Comment */}
                

                {/* Cart Items */}
                {state.orderRequestitems.map((item) => (
                  <div key={item.cartItemId} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          @ {getProductPrice(item).toLocaleString()} TZS
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-medium min-w-[2rem] text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFromCart(item.cartItemId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                         
                        {/* Item Total */}
                        <div className="mt-2">
                          <p className="font-semibold text-sm">
                            Total: @ {(getProductPrice(item) * item.quantity).toLocaleString()} TZS
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

          <div className="bg-blue-50 rounded-lg p-3">
                  <Label htmlFor="global-comment" className="text-sm font-medium mb-2 block">
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    Order Notes (Optional)
                  </Label>
                  <Textarea
                    id="global-comment"
                    placeholder="Any special instructions for your order..."
                    value={state.globalComment}
                    onChange={(e) => updateGlobalComment(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                </div>
              </div>
            ) : (
              // Customer Details Form
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Customer Details</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={state.customerDetails.firstName}
                        onChange={(e) => updateCustomerDetails({ firstName: e.target.value })}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={state.customerDetails.lastName}
                        onChange={(e) => updateCustomerDetails({ lastName: e.target.value })}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={state.customerDetails.phoneNumber}
                      onChange={(e) => updateCustomerDetails({ phoneNumber: e.target.value })}
                      placeholder="+255 xxx xxx xxx"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select 
                      value={state.customerDetails.gender} 
                      onValueChange={(value: 'MALE' | 'FEMALE') => updateCustomerDetails({ gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={state.customerDetails.emailAddress}
                      onChange={(e) => updateCustomerDetails({ emailAddress: e.target.value })}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomerForm(false)}
                    className="flex-1"
                  >
                    Back to Cart
                  </Button>
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={!isFormValid() || isSubmitting}
                    className={`flex-1 ${businessType.primary} hover:${businessType.accent} text-white`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Order'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Total and Checkout */}
          {state.orderRequestitems.length > 0 && !showCustomerForm && (
            <div className="border-t p-4 bg-white">
              <div className="mb-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>@ {totalAmount.toLocaleString()} TZS</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowCustomerForm(true)}
                className={`w-full ${businessType.primary} hover:${businessType.accent} text-white`}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;