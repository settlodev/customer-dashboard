import { UUID } from "crypto";
import { invoiceStatus } from "../enums";
import { Subscriptions } from "../subscription/type";

export declare interface Invoice  {
    id: UUID;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    paymentStatus:string;
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
    startDate: string;
    endDate:string;
    subscriptionStatus:string;
    active:boolean;
    isTrial:boolean;
    status:boolean;
    canDelete:boolean;
    location:UUID;
    subscription:Subscriptions
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

 