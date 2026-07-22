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

/** Product-list tabs, as the inventory service's `?view=` names them. */
export type ProductExportView = "ACTIVE" | "ARCHIVED" | "DRAFT" | "ALL";

/**
 * Catalogue export — one row per (product, variant).
 *
 * The backend emits the PRODUCT import template's columns first, so an
 * operator can export, bulk-edit in a spreadsheet, and re-import the same
 * file through /imports/products without reshaping the header row.
 *
 * `view` and `search` mirror the product list's own filters so the download
 * matches the tab (and search term) it was fired from.
 */
export async function exportProductsCsv(
  view: ProductExportView = "ACTIVE",
  search?: string,
): Promise<CsvExportPayload> {
  const params = new URLSearchParams({ view });
  if (search?.trim()) params.set("search", search.trim());
  return fetchCsv(inventoryUrl(`/api/v1/exports/products?${params.toString()}`));
}
