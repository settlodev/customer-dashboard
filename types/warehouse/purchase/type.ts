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

  export interface StockIntakePurchasesReport{
    totalStockIntakePurchases: number
    paidStockIntakePurchases: number
    partiallyPaidStockIntakePurchases: number
    unpaidStockIntakePurchases: number
    totalPurchaseCost: number
    paidStockIntakePurchasesAmount: number
    unpaidStockIntakePurchasesAmount: number
}