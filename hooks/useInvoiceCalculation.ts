import { useMemo } from 'react';

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

export const useInvoiceCalculations = (
  invoiceItems: InvoiceItem[],
  discount: number,
  discountType: 'percentage' | 'fixed'
) => {
  

  const subtotal = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [invoiceItems]);

  const discountAmount = useMemo(() => {
    if (discount <= 0) return 0;
    
    if (discountType === 'percentage') {
      // For percentage: calculate percentage of subtotal
      const percentageDiscount = (subtotal * discount) / 100;
      // console.log(`Percentage discount: ${discount}% of ${subtotal} = ${percentageDiscount}`);
      return percentageDiscount;
    } else if (discountType === 'fixed') {
      // For fixed: use the discount amount directly, but don't exceed subtotal
      const fixedDiscount = Math.min(discount, subtotal);
      // console.log(`Fixed discount: ${discount}, applied: ${fixedDiscount} (max: ${subtotal})`);
      return fixedDiscount;
    }
    
    return 0;
  }, [subtotal, discount, discountType]);

  const total = useMemo(() => {
    const calculatedTotal = Math.max(0, subtotal - discountAmount);
    return calculatedTotal;
  }, [subtotal, discountAmount]);

  

  return { subtotal, discountAmount, total };
};