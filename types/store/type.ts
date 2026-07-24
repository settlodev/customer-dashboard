export interface Store {
  id: string;
  accountId: string;
  businessId: string;
  locationId: string;
  name: string;
  slug: string;
  identifier: string;
  active: boolean;
  storeNumber?: string;
  code?: string;
  storeType?: string;
  timezone?: string;
  region?: string;
  district?: string;
  ward?: string;
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mirrors the Accounts Service `StoreSettingsResponse`
 * (`/api/v1/stores/{storeId}/settings`). A store is a stockroom hanging off a
 * location — it holds stock but never sells, so everything here is an
 * inventory / transfer / receiving concern.
 */
export interface StoreSettings {
  id: string;
  accountId: string;
  storeId: string;
  storeName: string | null;

  // Inventory
  trackInventory: boolean;
  allowNegativeStock: boolean;
  defaultReorderQuantity: number | null;

  // Transfers
  allowOutboundTransfers: boolean;
  allowInboundTransfers: boolean;
  requireTransferApproval: boolean;
  transferApprovalThreshold: number | null;
  autoApproveTransferLimit: number | null;
  /** Let other destinations request more from this store than it has on hand. */
  allowStockRequestsOverAvailable: boolean;

  // Receiving
  requireQualityCheck: boolean;
  autoReceiveAfterHours: number | null;
  requireReceivingPhotos: boolean;

  // Storage / tracking
  enableBinTracking: boolean;
  enableLotTracking: boolean;
  enableSerialTracking: boolean;

  // Counting & audit
  enableCycleCounting: boolean;
  cycleCountIntervalDays: number | null;
  requireAdjustmentApproval: boolean;
  adjustmentApprovalThreshold: number | null;

  // Operational
  enableBarcodeScanning: boolean;
  notifyLocationOnLowStock: boolean;
  autoRequestStock: boolean;

  createdAt?: string;
  updatedAt?: string;
}
