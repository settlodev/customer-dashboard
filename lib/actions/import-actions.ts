"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  CommitResponse,
  ImportType,
  PreviewResponse,
  RowDecision,
} from "@/types/imports/type";

import { getCurrentDestination } from "./context";
import { inventoryUrl } from "./inventory-client";

export type PreviewResult =
  | { ok: true; data: PreviewResponse }
  | { ok: false; message: string };

export type CommitResult =
  | { ok: true; data: CommitResponse }
  | { ok: false; data?: CommitResponse; message: string };

/**
 * Multipart preview. The file is forwarded as-is to the inventory
 * service which parses, validates, and caches the rows in Redis under
 * the returned {@code previewId}. The same id powers a later commit.
 */
export async function previewImport(
  type: ImportType,
  file: File,
): Promise<PreviewResult> {
  if (!file || file.size === 0) {
    return { ok: false, message: "Choose a CSV file" };
  }
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl("/api/v1/imports/preview"),
      fd,
    )) as PreviewResponse;
    return { ok: true, data: parseStringify(data) };
  } catch (error: unknown) {
    console.error("previewImport failed", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to preview import",
    };
  }
}

export async function commitImport(
  type: ImportType,
  previewId: string,
  decisions: RowDecision[],
): Promise<CommitResult> {
  if (!previewId) return { ok: false, message: "Missing previewId" };
  if (!decisions.length)
    return { ok: false, message: "No decisions to commit" };
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl("/api/v1/imports/commit"),
      { previewId, decisions },
    )) as CommitResponse;
    // Per-type cache busting so the imported records show up on
    // their list pages.
    invalidatePaths(type);
    return { ok: true, data: parseStringify(data) };
  } catch (error: unknown) {
    // The backend returns 422 with a structured CommitResponse when
    // the transaction rolled back — surface that to the UI verbatim.
    const apiData = (error as { response?: { data?: CommitResponse } })
      ?.response?.data;
    if (apiData && Array.isArray(apiData.errors) && apiData.errors.length) {
      return {
        ok: false,
        data: parseStringify(apiData),
        message: `${apiData.errors.length} row${apiData.errors.length > 1 ? "s" : ""} failed — batch rolled back`,
      };
    }
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Commit failed",
    };
  }
}

// ── Auto-create missing lookups ─────────────────────────────────────
//
// PRODUCT imports fail row-by-row when a referenced category or brand
// doesn't exist yet. Rather than forcing the merchant to bounce out and
// create them one by one, the preview screen lets them auto-create the
// missing ones in bulk; the front-end then re-runs the preview so the
// rows pick up the new IDs and turn READY.
//
// Department for new categories is left unset — the inventory service
// auto-resolves to the location's single / default department.

export interface BulkCreateLookupsResult {
  ok: boolean;
  createdCategories: number;
  createdBrands: number;
  errors: string[];
}

export async function bulkCreateMissingLookups({
  categories,
  brands,
}: {
  categories: string[];
  brands: string[];
}): Promise<BulkCreateLookupsResult> {
  const apiClient = new ApiClient();
  const locationType = (await getCurrentDestination())?.type ?? "LOCATION";

  const errors: string[] = [];
  let createdCategories = 0;
  let createdBrands = 0;

  const categoryTasks = categories.map(async (name) => {
    try {
      await apiClient.post(inventoryUrl("/api/v1/categories"), {
        locationType,
        name,
      });
      createdCategories++;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Create failed";
      errors.push(`Category "${name}": ${message}`);
    }
  });

  const brandTasks = brands.map(async (name) => {
    try {
      await apiClient.post(inventoryUrl("/api/v1/brands"), {
        locationType,
        name,
      });
      createdBrands++;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Create failed";
      errors.push(`Brand "${name}": ${message}`);
    }
  });

  await Promise.all([...categoryTasks, ...brandTasks]);
  return { ok: errors.length === 0, createdCategories, createdBrands, errors };
}

function invalidatePaths(type: ImportType) {
  switch (type) {
    case "PRODUCT":
    case "PRODUCT_WITH_STOCK":
      revalidatePath("/products");
      revalidatePath("/stock-variants");
      break;
    case "STOCK":
      revalidatePath("/stock-variants");
      break;
    case "STOCK_INTAKE":
      revalidatePath("/stock-intakes");
      revalidatePath("/stock-variants");
      break;
  }
}
