'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { businessTypes } from '@/types/site/type';
import { CartProvider } from '@/context/cartContext';
import CartPage from '@/components/site/cart';

export default function Cart() {
  const searchParams = useSearchParams();
  const locationId = searchParams.get('location');

  return (
    <CartProvider>
      <CartPage 
        businessType={businessTypes.default}
        locationId={locationId || undefined}
      />
    </CartProvider>
  );
}