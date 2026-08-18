export interface PackagingReportItem {
  stockId: string;
  variantId: string;
  stockName: string;
  variantName: string;
  containerMode: "RETURNABLE" | "CONSUMABLE";
  depositValue: number | null;
  depositCurrency: string | null;
  quantityOnHand: number;
  depositLiability: number;
}

export interface PackagingReport {
  locationId: string;
  currency: string;
  totalDepositLiability: number;
  totalEmpties: number;
  packagingItemCount: number;
  returnableCount: number;
  consumableCount: number;
  items: PackagingReportItem[];
}

export const EMPTY_PACKAGING_REPORT: PackagingReport = {
  locationId: "", currency: "TZS", totalDepositLiability: 0, totalEmpties: 0,
  packagingItemCount: 0, returnableCount: 0, consumableCount: 0, items: [],
};
