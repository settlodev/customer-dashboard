import { UUID } from "crypto";

export declare interface Invoice  {
    id: UUID;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    invoiceStatus: string;
    location: UUID;
    isArchived: boolean;
    locationSubscriptions:locationSubscriptions[]
}

declare interface locationSubscriptions {
    id: UUID;
    numberOfMonths: number;
    amountPerSubscription: number;
    totalSubscriptionAmount: number;
    subscription:UUID;
    invoice:UUID
}

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