import { UUID } from 'crypto';

export declare interface StockVariant {
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
    isArchived: boolean
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
  stockVariantName: string;
  stockIntakeBatchNumber: string | null;
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