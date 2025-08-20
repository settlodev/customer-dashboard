import { UUID } from "crypto";
import { invoiceStatus } from "../enums";

export declare interface Invoice  {
    id: UUID;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    invoiceStatus: string;
    location: UUID;
    isArchived: boolean;
    locationInvoiceStatus: invoiceStatus;
    locationSubscriptions:locationSubscriptions[];
    warehouseSubscriptions:warehouseSubscriptions[];
    locationFreeStandingAddonSubscriptions:locationFreeStandingAddonSubscriptions[]
    dateCreated: string;
    locationName:string
}

declare interface locationSubscriptions {
    id: UUID;
    numberOfMonths: number;
    amountPerSubscription: number;
    totalSubscriptionAmount: number;
    subscription:UUID;
    locationSubscriptionPackage:UUID;
    subscriptionPackageName:string;
    invoice:UUID
}
declare interface warehouseSubscriptions {
    id: UUID;
    startDate: string;
    endDate:string;
    active:boolean;
    istrial:boolean;
    subscriptionStatus:string    
}

declare interface locationFreeStandingAddonSubscriptions {
    targetedLocationSubscriptionId:string;
    targetedLocationSubscriptionStartDate:string;
    targetedLocationSubscriptionEndDate:string;
    targetedLocationSubscriptionSubscriptionPackageId:string;
    targetedLocationSubscriptionSubscriptionPackageName:string;
    subscriptionAddonId:string;
    targetedLocationSubscriptionLocationId:string;
    targetedLocationSubscriptionLocationName:string;   
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

 