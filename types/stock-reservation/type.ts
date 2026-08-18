export type StockReservationStatus = "ACTIVE" | "EXPIRED" | "RELEASED";

export interface StockReservation {
  id: string;
  locationId: string;
  stockVariantId: string;
  stockVariantName: string | null;
  stockName: string | null;
  stockVariantSku: string | null;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  reservedAt: string;
  reservationExpiresAt: string;
  releasedAt: string | null;
  status: StockReservationStatus;
}

export interface StockReservationPage {
  content: StockReservation[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const RESERVATION_STATUS_CONFIG: Record<
  StockReservationStatus,
  { label: string; tone: "green" | "amber" | "slate" }
> = {
  ACTIVE: { label: "Active", tone: "green" },
  EXPIRED: { label: "Expired", tone: "amber" },
  RELEASED: { label: "Released", tone: "slate" },
};

/** Friendly labels for the reference types the backend emits. */
export const RESERVATION_REFERENCE_LABELS: Record<string, string> = {
  SALE_ORDER: "Sale order",
  ORDER_REQUEST: "Order request",
  TRANSFER: "Transfer",
};
