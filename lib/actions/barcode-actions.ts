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
      "image/png",
    );
    const buffer = await toBuffer(data);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("getBarcodeImageDataUrl failed:", error);
    return null;
  }
}

async function toBuffer(data: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return Buffer.from(view.buffer, view.byteOffset, view.byteLength);
  }
  if (data && typeof (data as Blob).arrayBuffer === "function") {
    return Buffer.from(await (data as Blob).arrayBuffer());
  }
  if (typeof data === "string") return Buffer.from(data, "binary");
  throw new Error(`Unsupported binary payload: ${Object.prototype.toString.call(data)}`);
}
