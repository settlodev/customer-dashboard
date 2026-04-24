"use server";

import ApiClient from "@/lib/settlo-api-client";
import { inventoryUrl } from "./inventory-client";

export interface CsvExportPayload {
  /** UTF-8 CSV body. */
  csv: string;
  /** Suggested download filename from the backend's Content-Disposition header. */
  filename: string;
}

/**
 * Server action that fetches a CSV export from the Inventory Service and
 * returns its raw text body. The caller turns it into a Blob + object URL in
 * the browser — avoids shipping Blobs across the server-action boundary,
 * which Next.js can't serialise cleanly.
 */
async function fetchCsv(url: string): Promise<CsvExportPayload> {
  const apiClient = new ApiClient();
  const { data, filename } = await apiClient.downloadFile(url);
  return { csv: data.toString("utf-8"), filename };
}

export async function exportInventoryCsv(): Promise<CsvExportPayload> {
  return fetchCsv(inventoryUrl("/api/v1/exports/inventory"));
}

export async function exportMovementsCsv(
  from: string,
  to: string,
): Promise<CsvExportPayload> {
  const params = new URLSearchParams({ from, to });
  return fetchCsv(inventoryUrl(`/api/v1/exports/movements?${params.toString()}`));
}
