'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { businessTypes } from '@/types/site/type';
import { CartProvider } from '@/context/cartContext';
import CheckoutPage from '@/components/site/checkout';

export default function Checkout() {
  const searchParams = useSearchParams();
  const locationId = searchParams.get('location');

  return (
    <CartProvider>
      <CheckoutPage 
        businessType={businessTypes.default}
        locationId={locationId || undefined}
      />
    </CartProvider>
  );
}