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

/**
 * Fetches the backend-rendered Code128 PNG for a barcode and returns it as an
 * inline base64 data URL. Inline URL lets the <img> render without a second
 * authenticated round-trip from the browser.
 */
export async function getBarcodeImageDataUrl(
  barcode: string,
  width = 300,
  height = 100,
): Promise<string | null> {
  if (!barcode) return null;
  try {
    const apiClient = new ApiClient();
    const { data } = await apiClient.downloadFile(
      inventoryUrl(
        `/api/v1/barcodes/image/${encodeURIComponent(barcode)}?width=${width}&height=${height}`,
      ),
    );
    const buffer = Buffer.isBuffer(data)
      ? (data as unknown as Buffer)
      : Buffer.from(await (data as Blob).arrayBuffer());
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
