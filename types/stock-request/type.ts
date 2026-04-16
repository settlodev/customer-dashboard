/**
 * Stock request types — used for location-to-warehouse and
 * warehouse-to-location stock requests.
 */

export interface StockRequests {
  id: string;
  requestNumber: string;
  fromLocationId: string;
  fromLocationName: string | null;
  toLocationId: string;
  toLocationName: string | null;
  status: string;
  requestedBy: string;
  requestedByName: string | null;
  notes: string | null;
  items: StockRequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockRequestItem {
  id: string;
  stockVariantId: string;
  stockVariantName: string;
  quantity: number;
  approvedQuantity: number | null;
  notes: string | null;
}

export interface StockRequestReport {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}
