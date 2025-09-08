'use client';
import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, Trash2, User, MessageCircle, CheckCircle } from 'lucide-react';
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
import { useRouter } from 'next/navigation';

interface CartSidebarProps {
  businessType: BusinessType;
  businessInfo?: BusinessInfo;
  locationId?: string; 
}

const CartSidebar: React.FC<CartSidebarProps> = ({ businessType, locationId }) => {
  const router = useRouter();
  const { 
    state, 
    updateQuantity, 
    removeFromCart, 
    toggleCart,
    updateCustomerDetails,
    updateGlobalComment,
    getTotalPrice,
    clearCart
  } = useCart();

  console.log("The state of the cart is ",state)
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Track which items have quantity input focused
  const [quantityInputs, setQuantityInputs] = useState<{[key: string]: string}>({});

  const getProductPrice = (item: any) => {
    // First check selectedVariant object
    if (item.selectedVariant && item.selectedVariant.price !== undefined) {
      return parseFloat(item.selectedVariant.price as unknown as string) || 0;
    }
    
    // Then check by variantId in variants array
    if (item.variantId && item.variants) {
      const variant = item.variants.find((v: any) => v.id === item.variantId);
      if (variant && variant.price !== undefined) {
        return parseFloat(variant.price as unknown as string) || 0;
      }
    }
    
    // Fallback to selectedVariantId
    if (item.selectedVariantId && item.variants) {
      const variant = item.variants.find((v: any) => v.id === item.selectedVariantId);
      if (variant) {
        return parseFloat(variant.price as unknown as string) || 0;
      }
    }
    
    // If no variants, use first variant price
    if (item.variants && item.variants.length > 0) {
      return parseFloat(item.variants[0].price as unknown as string) || 0;
    }
    
    // Final fallback to item price
    return parseFloat(item.price as string) || 0;
  };

  // Get available quantity for an item using variant availableStock
  const getAvailableQuantity = (item: any) => {
    // First check selectedVariant object for availableStock
    if (item.selectedVariant && item.selectedVariant.availableStock !== undefined) {
      const availableStock = parseInt(item.selectedVariant.availableStock as string) || 0;
      console.log(`Available stock for ${item.name} (selectedVariant):`, availableStock);
      return availableStock;
    }
    
    // Then check by variantId in variants array
    if (item.variantId && item.variants) {
      const variant = item.variants.find((v: any) => v.id === item.variantId);
      if (variant && variant.availableStock !== undefined) {
        const availableStock = parseInt(variant.availableStock as string) || 0;
        console.log(`Available stock for ${item.name} (by variantId):`, availableStock);
        return availableStock;
      }
    }
    
    // Fallback to selectedVariantId
    if (item.selectedVariantId && item.variants) {
      const variant = item.variants.find((v: any) => v.id === item.selectedVariantId);
      if (variant && variant.availableStock !== undefined) {
        const availableStock = parseInt(variant.availableStock as string) || 0;
        console.log(`Available stock for ${item.name} (by selectedVariantId):`, availableStock);
        return availableStock;
      }
    }
    
    // If no variants found, use first variant availableStock
    if (item.variants && item.variants.length > 0 && item.variants[0].availableStock !== undefined) {
      const availableStock = parseInt(item.variants[0].availableStock as string) || 0;
      console.log(`Available stock for ${item.name} (first variant):`, availableStock);
      return availableStock;
    }
    
    // Final fallback to 0 if no variant stock found
    console.log(`No available stock found for ${item.name}, defaulting to 0`);
    return 0;
  };

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
      return;
    }

    // Find the item in the cart
    const cartItem = state.orderRequestitems.find(item => item.cartItemId === cartItemId);
    if (!cartItem) {
      toast.error('Item not found in cart');
      return;
    }

    const availableQuantity = getAvailableQuantity(cartItem);
    
    // Check if the new quantity exceeds available stock
    if (newQuantity > availableQuantity) {
      toast.error(`Only ${availableQuantity} item(s) available in stock`);
      return;
    }

    updateQuantity(cartItemId, newQuantity);
  };

  // Handle direct quantity input change
  const handleQuantityInputChange = (cartItemId: string, value: string) => {
    setQuantityInputs(prev => ({
      ...prev,
      [cartItemId]: value
    }));
  };

  // Handle quantity input blur (when user finishes typing)
  const handleQuantityInputBlur = (cartItemId: string) => {
    const inputValue = quantityInputs[cartItemId];
    if (inputValue === undefined) return;

    const newQuantity = parseInt(inputValue);
    
    if (isNaN(newQuantity) || newQuantity < 1) {
      // Reset to current quantity if invalid
      const cartItem = state.orderRequestitems.find(item => item.cartItemId === cartItemId);
      if (cartItem) {
        setQuantityInputs(prev => ({
          ...prev,
          [cartItemId]: cartItem.quantity.toString()
        }));
      }
      return;
    }

    handleQuantityChange(cartItemId, newQuantity);
    
    // Clear the input state
    setQuantityInputs(prev => {
      const newState = { ...prev };
      delete newState[cartItemId];
      return newState;
    });
  };

  // Handle Enter key press in quantity input
  const handleQuantityInputKeyPress = (cartItemId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuantityInputBlur(cartItemId);
    }
  };

  // Check if we can increase quantity for an item
  const canIncreaseQuantity = (cartItem: any) => {
    const availableQuantity = getAvailableQuantity(cartItem);
    // Get the current cart quantity for this specific cart item
    const currentCartQuantity = cartItem.quantity || 1;
    
    console.log(`Can increase quantity check for ${cartItem.name}:`, {
      availableQuantity,
      currentCartQuantity,
      canIncrease: currentCartQuantity < availableQuantity
    });
    
    return currentCartQuantity < availableQuantity;
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
      console.log('Order submission result:', result);
      
      if (result && result.responseType === 'success') {
        // Success - show success animation first
        toast.success(result.message || 'Order created successfully!');
        
        // Close cart and clear it immediately
        toggleCart();
        clearCart();
        setShowCustomerForm(false);
        
        // Show success animation
        setShowSuccessAnimation(true);

        // After animation, redirect to menu
        setTimeout(() => {
          setShowSuccessAnimation(false);
          if (locationId) {
            router.push(`/menu/${locationId}`);
          }
        }, 5000);
        
      } else if (result && result.responseType === 'error') {
        // Handle error response
        toast.error(result.message || 'Failed to submit order request');
      } else {
        // Handle unexpected response format
        toast.error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = getTotalPrice();

  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-60 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center animate-pulse">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
          <p className="text-gray-600">Your order has been submitted successfully</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
          <div className="bg-green-600 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
        <p className="text-sm text-gray-500">Redirecting to menu...</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Success Animation Overlay */}
      {showSuccessAnimation && <SuccessAnimation />}

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
                {/* Cart Items */}
                {state.orderRequestitems.map((item) => {
                  const availableQuantity = getAvailableQuantity(item);
                  const canIncrease = canIncreaseQuantity(item);
                  
                  return (
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
                          
                          {/* Stock info */}
                          <p className="text-xs text-gray-500">
                            Available: {availableQuantity} item(s)
                          </p>
                          
                          {/* Enhanced Quantity Controls - Conditional based on available quantity */}
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
                              
                              {/* Conditional Quantity Display/Input */}
                              {availableQuantity <= 1 ? (
                                // Simple display for single item stock
                                <span className="font-medium min-w-[2rem] text-center">{item.quantity}</span>
                              ) : (
                                // Direct Quantity Input for multiple items
                                <Input
                                  type="number"
                                  min="1"
                                  max={availableQuantity}
                                  value={quantityInputs[item.cartItemId] ?? item.quantity}
                                  onChange={(e) => handleQuantityInputChange(item.cartItemId, e.target.value)}
                                  onBlur={() => handleQuantityInputBlur(item.cartItemId)}
                                  onKeyPress={(e) => handleQuantityInputKeyPress(item.cartItemId, e)}
                                  className="h-8 w-16 text-center text-sm font-medium px-1"
                                  placeholder={item.quantity.toString()}
                                />
                              )}
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className={`h-8 w-8 ${!canIncrease ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                                disabled={!canIncrease}
                                title={!canIncrease ? 'Maximum quantity reached' : 'Increase quantity'}
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
                          
                          {/* Quick quantity buttons only for items with stock >= 10 */}
                          {availableQuantity >= 10 && (
                            <div className="flex gap-1 mt-2">
                              <span className="text-xs text-gray-500 mr-2">Quick:</span>
                              {[10, 25, 50, 100].filter(qty => qty <= availableQuantity).map(qty => (
                                <Button
                                  key={qty}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600"
                                  onClick={() => handleQuantityChange(item.cartItemId, qty)}
                                >
                                  {qty}
                                </Button>
                              ))}
                            </div>
                          )}
                           
                          {/* Item Total */}
                          <div className="mt-2">
                            <p className="font-semibold text-sm">
                              Total: @ {(getProductPrice(item) * item.quantity).toLocaleString()} TZS
                            </p>
                          </div>
                          
                          {/* At maximum quantity warning */}
                          {item.quantity >= availableQuantity && availableQuantity > 0 && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              Maximum quantity reached
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select 
                      value={state.customerDetails.gender} 
                      onValueChange={(value: 'MALE' | 'FEMALE') => updateCustomerDetails({ gender: value })}
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomerForm(false)}
                    className="flex-1"
                    disabled={isSubmitting}
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
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>{totalAmount.toLocaleString()} TZS</span>
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