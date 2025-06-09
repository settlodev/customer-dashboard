export interface InvoiceItem {
    id: number;
    type: 'subscription' | 'service';
    itemId: string;
    name: string;
    unitPrice: number;
    months: number;
    totalPrice: number;
    actionType?: 'upgrade' | 'downgrade' | 'renew' | 'switch' | 'subscribe';
    isRenewal?: boolean;
  }

import { useMemo } from 'react';
export const useInvoiceCalculations = (
  invoiceItems: InvoiceItem[],
  discount: number,
  discountType: 'percentage' | 'fixed'
) => {
  const subtotal = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [invoiceItems]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return discount;
  }, [subtotal, discount, discountType]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  return { subtotal, discountAmount, total };
};