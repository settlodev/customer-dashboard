import { UUID } from "crypto";
  export interface Purchase {
    id: UUID; 
    stockIntakePurchaseNumber: string;
    totalPurchaseCost: number;
    paidAmount: number; 
    unpaidAmount: number;
    paymentStatus: string;
    stockIntake:UUID
    stockName:string
    stockVariantName:string
  }