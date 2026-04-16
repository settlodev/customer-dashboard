"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { StockVariant } from "@/types/stock/type";
import { inventoryUrl } from "./inventory-client";
import { revalidatePath } from "next/cache";

export async function assignBarcode(
  variantId: string,
  barcode?: string,
): Promise<StockVariant> {
  const apiClient = new ApiClient();
  const params = barcode
    ? `?barcode=${encodeURIComponent(barcode)}`
    : "";
  const data = await apiClient.post(
    inventoryUrl(`/api/v1/barcodes/variants/${variantId}${params}`),
    {},
  );
  revalidatePath("/stock-variants");
  return parseStringify(data);
}

export async function bulkGenerateBarcodes(): Promise<StockVariant[]> {
  const apiClient = new ApiClient();
  const data = await apiClient.post(
    inventoryUrl("/api/v1/barcodes/bulk-generate"),
    {},
  );
  revalidatePath("/stock-variants");
  return parseStringify(data) as StockVariant[];
}

export async function lookupBarcode(
  barcode: string,
): Promise<StockVariant | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/barcodes/lookup/${encodeURIComponent(barcode)}`,
      ),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}
