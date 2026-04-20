import type { DestinationType } from "@/types/catalogue/enums";

/**
 * Dashboard projection of the backend `LocationConfig`. Only drives feature
 * gating and rendering decisions — this is never the authoritative source of
 * truth for the data itself.
 */
export interface LocationConfig {
  id: string;
  locationId: string;
  locationType: DestinationType;
  locationName: string | null;
  businessId: string | null;
  parentLocationId: string | null;

  timezone: string;
  businessOpenTime: string;
  businessCloseTime: string;
  autoClosing: boolean;
  currency: string;

  deductStockOnItemChange: boolean;
  deductStockOnOrderClose: boolean;
  deductStockOnPartialPay: boolean;
  useRecipe: boolean;
  reservationExpiryMinutes: number;
  expiryAlertDays: number;
  autoReorderEnabled: boolean;

  batchTrackingEnabled: boolean;
  qualityInspectionEnabled: boolean;
  warehouseManagementEnabled: boolean;
  cycleCountingEnabled: boolean;
  consumptionRulesEnabled: boolean;
  rfqEnabled: boolean;
  requirePurchaseRequisitionApproval: boolean;
  supplierPerformanceTrackingEnabled: boolean;
  landedCostTrackingEnabled: boolean;
  locationToLocationTransferEnabled: boolean;
}
