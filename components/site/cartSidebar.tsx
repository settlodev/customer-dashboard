
'use client';
import React, { useEffect, useState } from 'react';
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
import { getProductStockStatus } from './productStockStatus';

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

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Track which items have quantity input focused
  const [quantityInputs, setQuantityInputs] = useState<{[key: string]: string}>({});
  const [rememberDetails, setRememberDetails] = useState(false);

  useEffect(() => {
    const savedCustomerDetails = localStorage.getItem('customerDetails');
    if (savedCustomerDetails) {
      try {
        const parsedDetails = JSON.parse(savedCustomerDetails);
        updateCustomerDetails(parsedDetails);
        setRememberDetails(true); 
      } catch (error) {
        console.error('Error parsing saved customer details:', error);
      }
    }
  }, []);

  const getProductPrice = (item: any) => {
    if (item.selectedVariant && item.selectedVariant.price !== undefined) {
      return parseFloat(item.selectedVariant.price as unknown as string) || 0;
    }
    
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

  // Check if an item has unlimited stock (availableStock: null AND trackingType: null)
  const hasUnlimitedStock = (item: any): boolean => {
    if (item.variants && item.variants.length > 0) {
      let selectedVariant = item.selectedVariant;
      
      if (!selectedVariant && item.variantId) {
        selectedVariant = item.variants.find((v: any) => v.id === item.variantId);
      }
      
      if (!selectedVariant && item.selectedVariantId) {
        selectedVariant = item.variants.find((v: any) => v.id === item.selectedVariantId);
      }
      
      if (!selectedVariant && item.variants.length === 1) {
        selectedVariant = item.variants[0];
      }
      
      // Check if selected variant has unlimited stock
      if (selectedVariant) {
        return selectedVariant.trackingType === null && 
               selectedVariant.availableStock === null;
      }
      
      return false;
    }
    
    // Check if it's a regular product with unlimited stock
    return item.trackingType === null && 
           item.availableStock === null;
  };

  const getAvailableQuantity = (item: any): number => {
    
    if (hasUnlimitedStock(item)) {
      return 0; // 0 represents unlimited stock
    }
    
    const stockInfo = getProductStockStatus(item);
    
    if (stockInfo.hasVariants && stockInfo.variantStockInfo) {
      let selectedVariantId = item.selectedVariantId || item.variantId;
      
      if (item.selectedVariant && item.selectedVariant.id) {
        selectedVariantId = item.selectedVariant.id;
      }
      
      if (selectedVariantId && stockInfo.variantStockInfo[selectedVariantId]) {
        return stockInfo.variantStockInfo[selectedVariantId].quantity;
      }
      
      return 0;
    }
    return stockInfo.quantity;
  };

  // Check if an item is in stock
  const isItemInStock = (item: any): boolean => {
    if (hasUnlimitedStock(item)) {
      return true;
    }
    
    const stockInfo = getProductStockStatus(item);
    return stockInfo.status === 'in-stock';
  };


  const canIncreaseQuantity = (cartItem: any): boolean => {
    if (hasUnlimitedStock(cartItem)) {
      return true;
    }
    
    const availableQuantity = getAvailableQuantity(cartItem);
    
    const currentCartQuantity = cartItem.quantity || 1;
    
    return currentCartQuantity < availableQuantity;
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

    // Only validate stock if it's NOT unlimited
    if (!hasUnlimitedStock(cartItem)) {
      const availableQuantity = getAvailableQuantity(cartItem);
      
      // Check if the new quantity exceeds available stock
      if (newQuantity > availableQuantity) {
        toast.error(`Only ${availableQuantity} item(s) available in stock`);
        return;
      }
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

  // Get stock display text for an item
  const getStockDisplayText = (item: any): string => {
    // Special case for unlimited stock
    if (hasUnlimitedStock(item)) {
      return 'In Stock (Unlimited)';
    }
    
    const stockInfo = getProductStockStatus(item);
    
    if (stockInfo.status === 'out-of-stock') {
      return 'Out of Stock';
    }

    if (stockInfo.hasVariants) {
      // Try to find the selected variant ID
      let selectedVariantId = item.selectedVariantId || item.variantId;
      if (item.selectedVariant && item.selectedVariant.id) {
        selectedVariantId = item.selectedVariant.id;
      }
      
      if (selectedVariantId && stockInfo.variantStockInfo) {
        const variantStock = stockInfo.variantStockInfo[selectedVariantId];
        if (variantStock.quantity === 0) {
          return 'In Stock'; // For variants with trackingType: null
        }
        return `${variantStock.quantity} available`;
      }
      return 'Check variant availability';
    }

    if (stockInfo.quantity === 0) {
      return 'In Stock'; // For products with trackingType: null
    }

    return `${stockInfo.quantity} available`;
  };

  const isFormValid = () => {
    const { customerDetails } = state;
    return customerDetails.firstName.trim() !== '' &&
           customerDetails.lastName.trim() !== '' &&
           customerDetails.phoneNumber.trim() !== '' &&
           customerDetails.gender.trim() !== '' &&
           customerDetails.emailAddress.trim() !== '';
  };

  const handleSubmitOrder = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all customer details');
      return;
    }

    if (rememberDetails) {
      localStorage.setItem('customerDetails', JSON.stringify(state.customerDetails));
    } else {
      localStorage.removeItem('customerDetails');
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
                  const isInStock = isItemInStock(item);
                  const isUnlimitedStock = hasUnlimitedStock(item);
                  
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
                          <div className="flex items-center gap-1 text-xs">
                            <div className={`w-2 h-2 rounded-full ${isInStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={isInStock ? 'text-green-600' : 'text-red-600'}>
                              {getStockDisplayText(item)}
                            </span>
                          </div>
                          
                          {/* Enhanced Quantity Controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                                disabled={!isInStock}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              
                              {/* Quantity Display/Input */}
                              <Input
                                type="number"
                                min="1"
                                max={!isUnlimitedStock && availableQuantity > 0 ? availableQuantity : undefined}
                                value={quantityInputs[item.cartItemId] ?? item.quantity}
                                onChange={(e) => handleQuantityInputChange(item.cartItemId, e.target.value)}
                                onBlur={() => handleQuantityInputBlur(item.cartItemId)}
                                onKeyPress={(e) => handleQuantityInputKeyPress(item.cartItemId, e)}
                                className="h-8 w-16 text-center text-sm font-medium px-1"
                                placeholder={item.quantity.toString()}
                                disabled={!isInStock}
                              />
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className={`h-8 w-8 ${!canIncrease && !isUnlimitedStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                                disabled={!canIncrease && !isUnlimitedStock}
                                title={!canIncrease && !isUnlimitedStock ? 'Maximum quantity reached' : 'Increase quantity'}
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
                          
                          {/* Quick quantity buttons for items with sufficient stock or unlimited stock */}
                          {isInStock && (isUnlimitedStock || availableQuantity >= 10) && (
                            <div className="flex gap-1 mt-2">
                              <span className="text-xs text-gray-500 mr-2">Quick:</span>
                              {[10, 25, 50, 100].filter(qty => isUnlimitedStock || qty <= availableQuantity).map(qty => (
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
                              Total: {(getProductPrice(item) * item.quantity).toLocaleString()} TZS
                            </p>
                          </div>
                          
                          {/* At maximum quantity warning (only for limited stock items) */}
                          {!isUnlimitedStock && isInStock && availableQuantity > 0 && item.quantity >= availableQuantity && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              Maximum quantity reached
                            </p>
                          )}
                          
                          {/* Out of stock warning */}
                          {!isInStock && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              This item is out of stock
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
                      <Label htmlFor="firstName">First Name <span className='text-red-500 font-medium'>*</span></Label>
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
                      <Label htmlFor="lastName">Last Name <span className='text-red-500 font-medium'>*</span></Label>
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
                    <Label htmlFor="phoneNumber">Phone Number <span className='text-red-500 font-medium'>*</span></Label>
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
                    <Label htmlFor="gender">Gender <span className='text-red-500 font-medium'>*</span></Label>
                    <Select 
                      value={state.customerDetails.gender} 
                      onValueChange={(value: 'MALE' | 'FEMALE'|'UNDISCLOSED') => updateCustomerDetails({ gender: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="UNDISCLOSED">Do not disclose</SelectItem>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address <span className='text-red-500 font-medium'>*</span></Label>
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
                  <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="rememberDetails"
            checked={rememberDetails}
            onChange={(e) => setRememberDetails(e.target.checked)}
            className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
            disabled={isSubmitting}
          />
          <Label htmlFor="rememberDetails" className="text-sm font-medium">
            Remember Me
          </Label>
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