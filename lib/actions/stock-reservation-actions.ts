"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type {
  StockReservationPage,
  StockReservationStatus,
} from "@/types/stock-reservation/type";

const EMPTY: StockReservationPage = {
  content: [],
  number: 0,
  size: 50,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

/**
 * Paginated location-scoped reservation query — "what's holding my stock?".
 * All filters are optional; status=null returns every state.
 */
export async function searchStockReservations(
  locationId: string,
  opts: {
    variantId?: string;
    referenceType?: string;
    referenceId?: string;
    status?: StockReservationStatus;
    page?: number;
    size?: number;
  } = {},
): Promise<StockReservationPage> {
  if (!locationId) return EMPTY;
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      page: String(opts.page ?? 0),
      size: String(opts.size ?? 50),
    });
    if (opts.variantId) params.set("variantId", opts.variantId);
    if (opts.referenceType) params.set("referenceType", opts.referenceType);
    if (opts.referenceId) params.set("referenceId", opts.referenceId);
    if (opts.status) params.set("status", opts.status);

    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/inventory/locations/${locationId}/reservations?${params.toString()}`,
      ),
    );
    return parseStringify(data) as StockReservationPage;
  } catch {
    return EMPTY;
  }
}
