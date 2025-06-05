import { UUID } from 'crypto';

export declare interface StockVariant {
    stockVariants: any;
    id: UUID,
    name: string,
    startingValue: number,
    startingQuantity: number,
    currentAvailable: number,
    currentTotalValue: number,
    alertLevel: number,
    quantity: number,
    imageOption: string,
    unit: string,
    unitName: string,
    status: boolean,
    canDelete: boolean,
    stock: string,
    stockName: string,
    stockAndStockVariantName: string,
    lastStockIntakeQuantity: number,
    lastStockIntakeTime: Date,
    expiryDate: Date,
    isArchived: boolean,
    stockMovement: StockMovement[]
}

export declare interface StockMovement {
    id: string;
  quantity: number;
  value: number;
  stockMovementType: string;
  previousAverageValue: number;
  previousTotalQuantity: number;
  newAverageValue: number;
  newTotalQuantity: number;
  staffName: string;
  stockName: string;
  stockVariant: string;
  stockVariantName: string;
  stockIntakeBatchNumber: string | null;
  stockIntake: string | null;
  order: string | null;
  orderItemRefund: string | null;
  orderItem: string | null;
  stockModification: string | null;
  dateCreated: Date

}

export declare interface StockFormVariant {
    id?: UUID,
    name: string,
    startingValue: number,
    startingQuantity: number,
    alertLevel: number,
    imageOption?: string|undefined|null,
}

export declare interface stockVariantSummary{
    id:UUID,
    stockVariantName:string,
    stockName:string,
    totalEstimatedProfit:number,
    currentCostPerItem:number,
    currentTotalQuantity:number,
    currentTotalValue:number,
    currentAverageValue:number
}