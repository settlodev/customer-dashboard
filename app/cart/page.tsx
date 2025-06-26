// 'use client';
// import React from 'react';
// import { Card, CardContent, CardHeader } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
// import { BusinessType } from '@/types/site/type';
// import { useCart } from '@/context/cartProvider';
// import { requestOrder } from '@/lib/actions/order-actions';
// import { UUID } from 'crypto';

// interface CartPageProps {
//   businessType: BusinessType;
//   location: string | null;
//   onBack: () => void;
// }

// const CartPage: React.FC<CartPageProps> = ({ businessType, onBack, location }) => {
//   const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();

//   const handleCheckout = async () => {
//     try {
//       const response = await requestOrder(cartItems, location);
//       console.log('Order created:', response);
//     } catch (error) {
//       console.error('Checkout failed:', error);
//     }
//   };

//   if (cartItems.length === 0) {
//     return (
//       <div className="min-h-screen bg-gray-50 p-4">
//         <div className="max-w-2xl mx-auto">
//           {/* Header */}
//           <div className="flex items-center justify-between mb-6">
//             <button
//               onClick={onBack}
//               className="flex items-center text-gray-600 hover:text-gray-800"
//             >
//               <ArrowLeft className="w-5 h-5 mr-2" />
//               Back
//             </button>
//             {/* <h1 className="text-2xl font-bold">Shopping Cart</h1> */}
//             <div className="w-20"></div>
//           </div>

//           {/* Empty Cart */}
//           <div className="text-center py-16">
//             <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
//             <p className="text-gray-500 mb-6">Add some items to get started!</p>
//             <Button 
//               onClick={onBack}
//               className={`${businessType.primary} hover:opacity-90`}
//             >
//               Continue browsing
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-4">
//       <div className="max-w-2xl mx-auto">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-6">
//           <button
//             onClick={onBack}
//             className="flex items-center text-gray-600 hover:text-gray-800"
//           >
//             <ArrowLeft className="w-5 h-5 mr-2" />
//             Back
//           </button>
//           {/* <h1 className="text-2xl font-bold">Shopping Cart</h1> */}
//           <Button 
//             variant="outline" 
//             size="sm"
//             onClick={clearCart}
//             className="text-red-600 hover:text-red-700 hover:bg-red-50"
//           >
//             Clear All
//           </Button>
//         </div>

//         {/* Cart Items */}
//         <div className="space-y-4 mb-6">
//           {cartItems.map((item) => (
//             <Card key={item.id} className="overflow-hidden">
//               <CardContent className="p-4">
//                 <div className="flex items-center space-x-4">
//                   {/* Product Image */}
//                   <div className="flex-shrink-0">
//                     {item.product.image ? (
//                       <img
//                         src={item.product.image}
//                         alt={item.product.name}
//                         className="w-16 h-16 object-cover rounded-lg"
//                       />
//                     ) : (
//                       <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
//                         <ShoppingCart className="w-6 h-6 text-gray-400" />
//                       </div>
//                     )}
//                   </div>

//                   {/* Product Details */}
//                   <div className="flex flex-col">
//                     <p className="text-sm font-normal text-gray-800">{item.product.name}</p>
//                   </div>

//                   {/* Quantity Controls */}
//                   <div className="flex items-center space-x-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => updateQuantity(item.id, item.quantity - 1)}
//                       className="w-7 h-7 p-0"
//                     >
//                       <Minus className="w-3 h-3" />
//                     </Button>
//                     <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => updateQuantity(item.id, item.quantity + 1)}
//                       className="w-7 h-7 p-0"
//                     >
//                       <Plus className="w-3 h-3" />
//                     </Button>
//                   </div>

//                   {/* Item Total */}
//                   <div className="text-right">
//                     <p className="text-xs font-semibold">
//                       {(item.price * item.quantity).toLocaleString()} <span className="text-xs font-normal">TZS</span>
//                     </p>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => removeFromCart(item.id)}
//                       className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {/* Cart Summary */}
//         <Card className="sticky bottom-4">
//           <CardHeader>
//             <h2 className="text-sm font-semibold">Summary</h2>
//           </CardHeader>
//           <CardContent>
//             <div className="flex justify-between items-center mb-4">
//               <span className="text-sm">Total Items:</span>
//               <span className="font-semibold">{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
//             </div>
//             <div className="flex justify-between items-center mb-6 text-xl font-bold">
//               <span className='text-sm'>Total:</span>
//               <span className='text-sm font-semibold'>{cartTotal.toLocaleString()} TZS</span>
//             </div>
//             <div className="space-y-3">
//               <Button 
//                 className={`w-full ${businessType.primary} hover:opacity-90`}
//                 size="lg"
//                 onClick={handleCheckout}
//               >
//                 Checkout
//               </Button>
//               <Button 
//                 variant="outline" 
//                 className="w-full"
//                 onClick={onBack}
//               >
//                 Continue browsing
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default CartPage; 

'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, X } from 'lucide-react';
import { BusinessType } from '@/types/site/type';
import { useCart } from '@/context/cartProvider';
import { requestOrder } from '@/lib/actions/order-actions';
import { UUID } from 'crypto';

interface CartPageProps {
  businessType: BusinessType;
  location: string | null;
  onBack: () => void;
}

interface CheckoutData {
  orderType: 'table' | 'customer';
  tableNumber?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
}

const CartPage: React.FC<CartPageProps> = ({ businessType, onBack, location }) => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    orderType: 'table'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckoutClick = () => {
    setShowCheckoutModal(true);
  };

  const handleCheckoutDataChange = (field: keyof CheckoutData, value: string) => {
    setCheckoutData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOrderTypeChange = (type: 'table' | 'customer') => {
    setCheckoutData(prev => ({
      ...prev,
      orderType: type,
      // Clear other fields when switching types
      tableNumber: type === 'table' ? prev.tableNumber : undefined,
      firstName: type === 'customer' ? prev.firstName : undefined,
      lastName: type === 'customer' ? prev.lastName : undefined,
      phoneNumber: type === 'customer' ? prev.phoneNumber : undefined,
      email: type === 'customer' ? prev.email : undefined,
    }));
  };

  const isFormValid = () => {
    if (checkoutData.orderType === 'table') {
      return checkoutData.tableNumber?.trim() !== '';
    } else {
      return checkoutData.firstName?.trim() !== '' && 
             checkoutData.lastName?.trim() !== '' && 
             (checkoutData.phoneNumber?.trim() !== '' || checkoutData.email?.trim() !== '');
    }
  };

  const handleFinalCheckout = async () => {
    if (!isFormValid()) return;

    setIsProcessing(true);
    try {
      const orderData = {
        ...cartItems,
        checkoutInfo: checkoutData
      };
      const response = await requestOrder(orderData, location);
      console.log('Order created:', response);
      setShowCheckoutModal(false);
      // Optionally clear cart after successful order
      // clearCart();
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setShowCheckoutModal(false);
    setCheckoutData({ orderType: 'table' });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="w-20"></div>
          </div>

          {/* Empty Cart */}
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some items to get started!</p>
            <Button 
              onClick={onBack}
              className={`${businessType.primary} hover:opacity-90`}
            >
              Continue browsing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear All
          </Button>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cartItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col">
                    <p className="text-sm font-normal text-gray-800">{item.product.name}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-xs font-semibold">
                      {(item.price * item.quantity).toLocaleString()} <span className="text-xs font-normal">TZS</span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cart Summary */}
        <Card className="sticky bottom-4">
          <CardHeader>
            <h2 className="text-sm font-semibold">Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm">Total Items:</span>
              <span className="font-semibold">{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between items-center mb-6 text-xl font-bold">
              <span className='text-sm'>Total:</span>
              <span className='text-sm font-semibold'>{cartTotal.toLocaleString()} TZS</span>
            </div>
            <div className="space-y-3">
              <Button 
                className={`w-full ${businessType.primary} hover:opacity-90`}
                size="lg"
                onClick={handleCheckoutClick}
              >
                Checkout
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onBack}
              >
                Continue browsing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Checkout Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeModal}
                  className="p-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Order Type Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Order Type</label>
                  <div className="flex space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="orderType"
                        value="table"
                        checked={checkoutData.orderType === 'table'}
                        onChange={() => handleOrderTypeChange('table')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Table Service</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="orderType"
                        value="customer"
                        checked={checkoutData.orderType === 'customer'}
                        onChange={() => handleOrderTypeChange('customer')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Customer Details</span>
                    </label>
                  </div>
                </div>

                {/* Table Number Input */}
                {checkoutData.orderType === 'table' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Table Number *</label>
                    <input
                      type="text"
                      placeholder="Enter table number"
                      value={checkoutData.tableNumber || ''}
                      onChange={(e) => handleCheckoutDataChange('tableNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Customer Details Form */}
                {checkoutData.orderType === 'customer' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">First Name *</label>
                        <input
                          type="text"
                          placeholder="First name"
                          value={checkoutData.firstName || ''}
                          onChange={(e) => handleCheckoutDataChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Last Name *</label>
                        <input
                          type="text"
                          placeholder="Last name"
                          value={checkoutData.lastName || ''}
                          onChange={(e) => handleCheckoutDataChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={checkoutData.phoneNumber || ''}
                        onChange={(e) => handleCheckoutDataChange('phoneNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={checkoutData.email || ''}
                        onChange={(e) => handleCheckoutDataChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      * Required fields. Please provide either phone number or email.
                    </p>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span>Total Items:</span>
                    <span>{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold mt-1">
                    <span>Total Amount:</span>
                    <span>{cartTotal.toLocaleString()} TZS</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3 p-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeModal}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  className={`flex-1 ${businessType.primary} hover:opacity-90`}
                  onClick={handleFinalCheckout}
                  disabled={!isFormValid() || isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;