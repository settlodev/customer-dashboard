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

export interface InvoiceCalculationResult {
  subtotal: number;
  subscriptionSubtotal: number;
  servicesSubtotal: number;
  discountAmount: number;
  subscriptionDiscountAmount: number;
  servicesDiscountAmount: number;
  total: number;
  subscriptionTotal: number;
  servicesTotal: number;
  itemBreakdown: Array<{
    item: InvoiceItem;
    originalPrice: number;
    discountApplied: number;
    finalPrice: number;
  }>;
}

export const useInvoiceCalculations = (
  invoiceItems: InvoiceItem[],
  discount: number,
  discountType: 'percentage' | 'fixed'
): InvoiceCalculationResult => {
  
  const calculations = useMemo(() => {
    // Separate items by type
    const subscriptionItems = invoiceItems.filter(item => item.type === 'subscription');
    const serviceItems = invoiceItems.filter(item => item.type === 'service');
    
    // Calculate original subtotals
    const subscriptionSubtotal = subscriptionItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const servicesSubtotal = serviceItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const subtotal = subscriptionSubtotal + servicesSubtotal;

    // Calculate discount per item and totals
    let totalDiscountAmount = 0;
    let subscriptionDiscountAmount = 0;
    let servicesDiscountAmount = 0;
    let subscriptionTotal = subscriptionSubtotal;
    let servicesTotal = servicesSubtotal;
    
    const itemBreakdown: Array<{
      item: InvoiceItem;
      originalPrice: number;
      discountApplied: number;
      finalPrice: number;
    }> = [];

    if (discount > 0) {
      // Apply discount to each item individually
      invoiceItems.forEach(item => {
        let itemDiscountAmount = 0;
        
        if (discountType === 'percentage') {
          itemDiscountAmount = (item.totalPrice * discount) / 100;
        } else if (discountType === 'fixed') {
          // Apply the full fixed discount to each item (up to the item's price)
          itemDiscountAmount = Math.min(discount, item.totalPrice);
        }
        
        const finalItemPrice = Math.max(0, item.totalPrice - itemDiscountAmount);
        
        // Add to breakdown
        itemBreakdown.push({
          item,
          originalPrice: item.totalPrice,
          discountApplied: itemDiscountAmount,
          finalPrice: finalItemPrice
        });
        
        // Accumulate totals by type
        if (item.type === 'subscription') {
          subscriptionDiscountAmount += itemDiscountAmount;
        } else {
          servicesDiscountAmount += itemDiscountAmount;
        }
        
        totalDiscountAmount += itemDiscountAmount;
      });
      
      // Calculate new totals after discount
      subscriptionTotal = Math.max(0, subscriptionSubtotal - subscriptionDiscountAmount);
      servicesTotal = Math.max(0, servicesSubtotal - servicesDiscountAmount);
    } else {
      // No discount - just create breakdown with original prices
      invoiceItems.forEach(item => {
        itemBreakdown.push({
          item,
          originalPrice: item.totalPrice,
          discountApplied: 0,
          finalPrice: item.totalPrice
        });
      });
    }

    const total = subscriptionTotal + servicesTotal;

    return {
      subtotal,
      subscriptionSubtotal,
      servicesSubtotal,
      discountAmount: totalDiscountAmount,
      subscriptionDiscountAmount,
      servicesDiscountAmount,
      total,
      subscriptionTotal,
      servicesTotal,
      itemBreakdown
    };
  }, [invoiceItems, discount, discountType]);

  return calculations;
};