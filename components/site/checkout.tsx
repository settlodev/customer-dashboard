'use client';

import React, { useState } from 'react';
import { ArrowLeft, MapPin, Phone, User, CreditCard, Truck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BusinessType } from '@/types/site/type';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cartContext';

interface CheckoutPageProps {
  businessType?: BusinessType;
  locationId?: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  specialInstructions: string;
}

interface PaymentInfo {
  method: 'cash' | 'card' | 'mobile';
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  mobileNumber?: string;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ 
  businessType = { 
    primary: 'bg-blue-600', 
    accent: 'bg-blue-700',
    secondary: 'bg-blue-100',
    text: 'text-blue-600'
  },
  locationId 
}) => {
  const { state, clearCart, getTotalPrice } = useCart();
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    specialInstructions: ''
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'cash'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const subtotal = getTotalPrice();
  const deliveryFee = subtotal > 50000 ? 0 : 5000;
  const total = subtotal + deliveryFee;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerInfo.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!customerInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!customerInfo.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(customerInfo.email)) newErrors.email = 'Email is invalid';
    if (!customerInfo.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!customerInfo.address.trim()) newErrors.address = 'Address is required';
    if (!customerInfo.city.trim()) newErrors.city = 'City is required';

    if (paymentInfo.method === 'card') {
      if (!paymentInfo.cardNumber?.trim()) newErrors.cardNumber = 'Card number is required';
      if (!paymentInfo.expiryDate?.trim()) newErrors.expiryDate = 'Expiry date is required';
      if (!paymentInfo.cvv?.trim()) newErrors.cvv = 'CVV is required';
    }

    if (paymentInfo.method === 'mobile') {
      if (!paymentInfo.mobileNumber?.trim()) newErrors.mobileNumber = 'Mobile number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePaymentInfoChange = (field: keyof PaymentInfo, value: string) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newOrderId = `ORD-${Date.now()}`;
      setOrderId(newOrderId);
      setOrderPlaced(true);
      clearCart();
      setIsSubmitting(false);
    }, 2000);
  };

  if (state.items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">No items to checkout</h2>
          <Link href={`/menu/${locationId || ''}`}>
            <Button className={`${businessType.primary} hover:${businessType.accent} text-white`}>
              Back to Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            {/* <CheckCircle className={`w-16 h-16 ${businessType.text} mx-auto mb-4`} /> */}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your order #{orderId} has been confirmed and is being prepared.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You will receive a confirmation email shortly with tracking details.
            </p>
            <div className="space-y-2">
              <Link href={`/menu/${locationId || ''}`}>
                <Button className={`w-full ${businessType.primary} hover:${businessType.accent} text-white`}>
                  Order Again
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" className="w-full">
                  View Order Status
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={customerInfo.firstName}
                      onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={customerInfo.lastName}
                      onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    value={customerInfo.specialInstructions}
                    onChange={(e) => handleCustomerInfoChange('specialInstructions', e.target.value)}
                    placeholder="Any special delivery instructions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={paymentInfo.method} 
                  onValueChange={(value) => setPaymentInfo(prev => ({ ...prev, method: value as 'cash' | 'card' | 'mobile' }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Cash on Delivery
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit/Debit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mobile" id="mobile" />
                    <Label htmlFor="mobile" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Mobile Money
                    </Label>
                  </div>
                </RadioGroup>

                {paymentInfo.method === 'card' && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentInfo.cardNumber || ''}
                        onChange={(e) => handlePaymentInfoChange('cardNumber', e.target.value)}
                        className={errors.cardNumber ? 'border-red-500' : ''}
                      />
                      {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date *</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={paymentInfo.expiryDate || ''}
                          onChange={(e) => handlePaymentInfoChange('expiryDate', e.target.value)}
                          className={errors.expiryDate ? 'border-red-500' : ''}
                        />
                        {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={paymentInfo.cvv || ''}
                          onChange={(e) => handlePaymentInfoChange('cvv', e.target.value)}
                          className={errors.cvv ? 'border-red-500' : ''}
                        />
                        {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {paymentInfo.method === 'mobile' && (
                  <div className="mt-4">
                    <Label htmlFor="mobileNumber">Mobile Money Number *</Label>
                    <Input
                      id="mobileNumber"
                      placeholder="Enter your mobile money number"
                      value={paymentInfo.mobileNumber || ''}
                      onChange={(e) => handlePaymentInfoChange('mobileNumber', e.target.value)}
                      className={errors.mobileNumber ? 'border-red-500' : ''}
                    />
                    {errors.mobileNumber && <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {state.items.map((item) => (
                    <div key={item.cartItemId} className="flex gap-3">
                      <div className="w-12 h-12 flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs">IMG</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium">
                        @ {(getProductPrice(item) * item.quantity).toLocaleString()} TZS
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>@ {subtotal.toLocaleString()} TZS</span>
                  </div>
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
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>@ {total.toLocaleString()} TZS</span>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className={`w-full mt-6 ${businessType.primary} hover:${businessType.accent} text-white py-3`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing Order...
                    </div>
                  ) : (
                    `Place Order - @ ${total.toLocaleString()} TZS`
                  )}
                </Button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  By placing this order, you agree to our terms and conditions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;