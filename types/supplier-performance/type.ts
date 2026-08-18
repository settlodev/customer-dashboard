export interface SupplierPerformance {
  id: string;
  supplierId: string;
  locationId: string | null;
  totalOrders: number;
  totalGrns: number;
  avgLeadTimeDays: number | null;
  /** 0–1. Percentage of ordered qty actually received. */
  fillRate: number | null;
  /** 0–1. (1 − returned/received) weighted by value. */
  qualityScore: number | null;
  totalOrderedQty: number;
  totalReceivedQty: number;
  totalReturnedQty: number;
  lastOrderDate: string | null;
  lastDeliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
}
