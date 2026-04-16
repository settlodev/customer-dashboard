"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  Stock,
  StockHistory,
  CsvImportJobResponse,
} from "@/types/stock/type";
import { getCurrentLocation } from "./business/get-current-business";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { StockSchema } from "@/types/stock/schema";
import { inventoryUrl } from "./inventory-client";

// ── Stock CRUD ──────────────────────────────────────────────────────

export async function getStocks(): Promise<Stock[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/stocks"));
    return parseStringify(data) as Stock[];
  } catch {
    return [];
  }
}

export async function getStock(id: string): Promise<Stock | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/stocks/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createStock(
  stock: z.infer<typeof StockSchema>,
): Promise<FormResponse | void> {
  const validated = StockSchema.safeParse(stock);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();

    const stockPayload = {
      name: validated.data.name,
      description: validated.data.description,
      baseUnitId: validated.data.baseUnitId,
      materialType: validated.data.materialType,
      variants: validated.data.variants.map((v) => ({
        name: v.name,
        sku: v.sku || undefined,
        unitId: v.unitId,
        conversionToBase: v.conversionToBase,
        barcode: v.barcode || undefined,
        serialTracked: v.serialTracked,
        startingQuantity: v.initialQuantity && v.initialQuantity > 0 ? v.initialQuantity : undefined,
        startingUnitCost: v.initialQuantity && v.initialQuantity > 0 ? (v.initialUnitCost ?? 0) : undefined,
      })),
    };

    const created = (await apiClient.post(
      inventoryUrl("/api/v1/stocks"),
      stockPayload,
    )) as Stock;

    revalidatePath("/stock-variants");
    redirect(`/stock-variants/${created.id}`);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create stock item",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateStock(
  id: string,
  stock: z.infer<typeof StockSchema>,
  removedVariantIds?: string[],
): Promise<FormResponse | void> {
  const validated = StockSchema.safeParse(stock);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();

    await apiClient.put(inventoryUrl(`/api/v1/stocks/${id}`), {
      name: validated.data.name,
      description: validated.data.description,
      baseUnitId: validated.data.baseUnitId,
      materialType: validated.data.materialType,
    });

    for (const variant of validated.data.variants) {
      if (!variant.id) {
        await apiClient.post(
          inventoryUrl(`/api/v1/stocks/${id}/variants`),
          {
            name: variant.name,
            sku: variant.sku || undefined,
            unitId: variant.unitId,
            conversionToBase: variant.conversionToBase,
            barcode: variant.barcode || undefined,
            serialTracked: variant.serialTracked,
          },
        );
      }
    }

    for (const variant of validated.data.variants) {
      if (variant.id) {
        await apiClient.put(
          inventoryUrl(`/api/v1/stocks/${id}/variants/${variant.id}`),
          {
            name: variant.name,
            sku: variant.sku || undefined,
            unitId: variant.unitId,
            conversionToBase: variant.conversionToBase,
          },
        );
      }
    }

    if (removedVariantIds?.length) {
      for (const variantId of removedVariantIds) {
        await apiClient.delete(
          inventoryUrl(`/api/v1/stocks/${id}/variants/${variantId}`),
        );
      }
    }

    revalidatePath("/stock-variants");
    redirect(`/stock-variants/${id}`);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update stock item",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteStock(id: string): Promise<void> {
  if (!id) throw new Error("Stock ID is required");
  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/stocks/${id}`));
  revalidatePath("/stock-variants");
}

export async function archiveStock(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stocks/${id}/archive`), {});
  revalidatePath("/stock-variants");
}

export async function unarchiveStock(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stocks/${id}/unarchive`), {});
  revalidatePath("/stock-variants");
}

export async function bulkArchiveStocks(stockIds: string[]): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl("/api/v1/stocks/bulk-archive"), {
    stockIds,
  });
  revalidatePath("/stock-variants");
}

export async function bulkAdjust(
  items: {
    stockVariantId: string;
    quantityChange: number;
    notes?: string;
  }[],
  category?: string,
  reason?: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl("/api/v1/stocks/bulk-adjust"), {
    items,
    category: category || "CORRECTION",
    reason,
  });
  revalidatePath("/stock-variants");
}

// ── Stock Variant CRUD (standalone) ─────────────────────────────────

export async function addStockVariant(
  stockId: string,
  variant: Record<string, unknown>,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/stocks/${stockId}/variants`),
    variant,
  );
  revalidatePath("/stock-variants");
}

export async function updateStockVariant(
  stockId: string,
  variantId: string,
  variant: Record<string, unknown>,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/stocks/${stockId}/variants/${variantId}`),
    variant,
  );
  revalidatePath("/stock-variants");
}

export async function deleteStockVariant(
  stockId: string,
  variantId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/stocks/${stockId}/variants/${variantId}`),
  );
  revalidatePath("/stock-variants");
}

export async function archiveStockVariant(
  stockId: string,
  variantId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(
      `/api/v1/stocks/${stockId}/variants/${variantId}/archive`,
    ),
    {},
  );
  revalidatePath("/stock-variants");
}

export async function unarchiveStockVariant(
  stockId: string,
  variantId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(
      `/api/v1/stocks/${stockId}/variants/${variantId}/unarchive`,
    ),
    {},
  );
  revalidatePath("/stock-variants");
}

// ── CSV Import (async, Java service) ────────────────────────────────

export async function startStockImport(
  fileContent: string,
  fileName: string,
): Promise<CsvImportJobResponse | FormResponse> {
  try {
    const apiClient = new ApiClient();
    const blob = new Blob([fileContent], { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", blob, fileName);

    const result = await apiClient.post(
      inventoryUrl("/api/v1/stocks/import-csv"),
      formData,
    );
    return parseStringify(result) as CsvImportJobResponse;
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to start import",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function getImportJobStatus(
  jobId: string,
): Promise<CsvImportJobResponse | null> {
  try {
    const apiClient = new ApiClient();
    const result = await apiClient.get(
      inventoryUrl(`/api/v1/stocks/import-csv/${jobId}`),
    );
    return parseStringify(result) as CsvImportJobResponse;
  } catch {
    return null;
  }
}

// ── CSV Export (local generation) ───────────────────────────────────

export async function downloadStockCSV(): Promise<string> {
  const stocks = await getStocks();
  const headers = [
    "Stock Name",
    "Variant Name",
    "Display Name",
    "SKU",
    "Unit",
    "Conversion to Base",
    "Barcode",
    "Serial Tracked",
    "Material Type",
  ];

  const rows = stocks.flatMap((stock) =>
    stock.variants
      .filter((v) => !v.archived)
      .map((v) => [
        stock.name,
        v.name,
        v.displayName,
        v.sku || "",
        v.unitAbbreviation,
        String(v.conversionToBase),
        v.barcode || "",
        v.serialTracked ? "Yes" : "No",
        stock.materialType,
      ]),
  );

  const escape = (val: string) =>
    val.includes(",") || val.includes('"')
      ? `"${val.replace(/"/g, '""')}"`
      : val;

  return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\n",
  );
}

export { getStocks as fetchStock };

// ── Reports (hits reports service) ──────────────────────────────────

export async function stockHistory(): Promise<StockHistory | null> {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();
    const data = await apiClient.get(
      `/api/reports/${location?.id}/stock/summary`,
    );
    return data as StockHistory;
  } catch {
    return null;
  }
}
