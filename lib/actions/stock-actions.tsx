"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  Stock,
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
      imageUrl: validated.data.imageUrl || undefined,
      variants: validated.data.variants.map((v) => ({
        name: v.name,
        sku: v.sku || undefined,
        unitId: v.unitId,
        conversionToBase: v.conversionToBase,
        barcode: v.barcode || undefined,
        serialTracked: v.serialTracked,
        startingQuantity: v.initialQuantity && v.initialQuantity > 0 ? v.initialQuantity : undefined,
        startingUnitCost: v.initialQuantity && v.initialQuantity > 0 ? (v.initialUnitCost ?? 0) : undefined,
        // Optional reorder / alert config — only forwarded when the user set
        // them. The backend skips the InventoryBalance upsert when all five
        // are null.
        reorderPoint: v.reorderPoint,
        reorderQuantity: v.reorderQuantity,
        preferredSupplierId:
          v.preferredSupplierId && v.preferredSupplierId.length > 0
            ? v.preferredSupplierId
            : undefined,
        lowStockThreshold: v.lowStockThreshold,
        overstockThreshold: v.overstockThreshold,
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
      errorCode: error?.code,
      metadata: error?.metadata,
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
      // Wrap the form's single primary URL into the list shape the
      // backend expects. Pass `undefined` to leave the gallery alone,
      // an empty list to clear it.
      imageUrls: validated.data.imageUrl ? [validated.data.imageUrl] : undefined,
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
            barcode: variant.barcode ?? "",
            serialTracked: variant.serialTracked,
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

/**
 * Create a stock item AND a 1:1 sellable product in one atomic backend
 * call. Mirrors createProductWithStock from the product side. Use when
 * the merchant is starting from the stock catalog but the item IS the
 * sellable thing (drink bottles, packaged goods).
 *
 * Selling price is per stock variant (carried as `sellingPrice` on each
 * variant in the schema), so a Coca-Cola stock item with 330ml/500ml
 * variants generates two product variants priced independently.
 *
 * The backend is expected to:
 *   1. Create the stock item with the supplied variants.
 *   2. Create a product whose variants link 1:1 (DIRECT mode) to each
 *      stock variant by index, using each variant's `sellingPrice`.
 *   3. Roll both back if either side fails.
 *
 * Endpoint: POST /api/v1/stocks/with-product (backend wiring pending).
 */
export async function createStockWithProduct(
  stock: z.infer<typeof StockSchema>,
  productOptions: {
    categoryIds?: string[];
    brandId?: string;
    nativeCurrency?: string;
    taxClass?: string;
    sellOnline?: boolean;
  },
): Promise<FormResponse | void> {
  const validated = StockSchema.safeParse(stock);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  const missingPrice = validated.data.variants.some(
    (v) => !v.sellingPrice || v.sellingPrice <= 0,
  );
  if (missingPrice) {
    return parseStringify({
      responseType: "error",
      message:
        "Each variant needs a selling price when also creating a product",
      error: new Error("variant.sellingPrice required"),
    });
  }

  try {
    const apiClient = new ApiClient();

    const payload = {
      name: validated.data.name,
      description: validated.data.description,
      baseUnitId: validated.data.baseUnitId,
      materialType: validated.data.materialType,
      imageUrl: validated.data.imageUrl || undefined,
      variants: validated.data.variants.map((v) => ({
        name: v.name,
        sku: v.sku || undefined,
        unitId: v.unitId,
        conversionToBase: v.conversionToBase,
        barcode: v.barcode || undefined,
        serialTracked: v.serialTracked,
        startingQuantity:
          v.initialQuantity && v.initialQuantity > 0
            ? v.initialQuantity
            : undefined,
        startingUnitCost:
          v.initialQuantity && v.initialQuantity > 0
            ? v.initialUnitCost ?? 0
            : undefined,
        reorderPoint: v.reorderPoint,
        reorderQuantity: v.reorderQuantity,
        preferredSupplierId:
          v.preferredSupplierId && v.preferredSupplierId.length > 0
            ? v.preferredSupplierId
            : undefined,
        lowStockThreshold: v.lowStockThreshold,
        overstockThreshold: v.overstockThreshold,
        // Per-variant selling price for the auto-created product variant.
        sellingPrice: v.sellingPrice,
      })),
      autoCreateProduct: true,
      product: {
        categoryIds: productOptions.categoryIds ?? [],
        brandId: productOptions.brandId || undefined,
        nativeCurrency: productOptions.nativeCurrency || "TZS",
        taxClass: productOptions.taxClass || undefined,
        sellOnline: productOptions.sellOnline ?? false,
      },
    };

    const created = (await apiClient.post(
      inventoryUrl("/api/v1/stocks/with-product"),
      payload,
    )) as Stock;

    revalidatePath("/stock-variants");
    revalidatePath("/products");
    redirect(`/stock-variants/${created.id}`);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create stock with product",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: error?.code,
      metadata: error?.metadata,
    });
  }
}

export { getStocks as fetchStock };

// ── Multi-image upload (STUB) ───────────────────────────────────────
// Mirrors uploadProductImages: accepts an array of data URLs and echoes
// them back so the form can render previews end-to-end pre-backend.
// Replace with a real multipart POST → asset/CDN service when wired up.
export async function uploadStockImages(
  dataUrls: string[],
): Promise<string[]> {
  // eslint-disable-next-line no-console
  console.warn(
    "[uploadStockImages] STUB — returning input data URLs. Wire this up to the asset service.",
  );
  return dataUrls;
}

// ── Save as draft ───────────────────────────────────────────────────
//
// Persists the in-progress form state without enforcing StockSchema's
// validation. Two flavors:
//   - First save (no stockId): POST /api/v1/stocks with draft=true.
//     Backend swaps in a placeholder name when blank, falls back to the
//     "Item" UoM for missing baseUnitId, and accepts zero variants.
//     Suppresses the STOCK_ITEM_CREATED Kafka fan-out until publish.
//   - Subsequent save (stockId set): PUT /api/v1/stocks/{id} with
//     whatever top-level fields are filled. Variants are managed
//     through the dedicated /variants endpoints — same separation as
//     the regular update flow.
//
// The response carries the persisted stock so the form can pin the new
// id and switch into edit mode without a full reload.
type DraftStockInput = Partial<z.infer<typeof StockSchema>>;
type DraftStockVariant = Partial<z.infer<typeof StockSchema>["variants"][number]>;

function mapStockVariantPartial(v: DraftStockVariant) {
  return {
    name: v.name?.trim() || undefined,
    sku: v.sku || undefined,
    unitId: v.unitId || undefined,
    conversionToBase: v.conversionToBase ?? undefined,
    barcode: v.barcode || undefined,
    serialTracked: v.serialTracked,
    startingQuantity:
      v.initialQuantity != null && v.initialQuantity > 0 ? v.initialQuantity : undefined,
    startingUnitCost:
      v.initialQuantity != null && v.initialQuantity > 0
        ? v.initialUnitCost ?? 0
        : undefined,
    reorderPoint: v.reorderPoint,
    reorderQuantity: v.reorderQuantity,
    preferredSupplierId:
      v.preferredSupplierId && v.preferredSupplierId.length > 0
        ? v.preferredSupplierId
        : undefined,
    lowStockThreshold: v.lowStockThreshold,
    overstockThreshold: v.overstockThreshold,
  };
}

export async function saveStockDraft(
  values: DraftStockInput,
  stockId?: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();

    const variantsArray = Array.isArray(values.variants) ? values.variants : [];
    const meaningfulVariants = variantsArray
      .map((v) => v as DraftStockVariant)
      .filter((v) => v && (v.name?.trim() || v.sku || v.barcode))
      .map(mapStockVariantPartial);

    const imageUrls = values.imageUrl ? [values.imageUrl] : undefined;

    if (!stockId) {
      const payload = {
        name: values.name?.trim() || undefined,
        description: values.description || undefined,
        baseUnitId: values.baseUnitId || undefined,
        materialType: values.materialType || undefined,
        imageUrls,
        variants: meaningfulVariants.length ? meaningfulVariants : undefined,
        draft: true,
      };

      const created = (await apiClient.post(
        inventoryUrl("/api/v1/stocks"),
        payload,
      )) as Stock;

      revalidatePath("/stock-variants");
      return parseStringify({
        responseType: "success",
        message: "Draft saved",
        data: created,
      });
    }

    // Existing draft — only top-level fields go through PUT. Variants stay
    // owned by the dedicated /variants endpoints.
    await apiClient.put(inventoryUrl(`/api/v1/stocks/${stockId}`), {
      name: values.name?.trim() || undefined,
      description: values.description ?? undefined,
      baseUnitId: values.baseUnitId || undefined,
      materialType: values.materialType || undefined,
      imageUrls,
    });

    revalidatePath("/stock-variants");
    revalidatePath(`/stock-variants/${stockId}`);
    return parseStringify({
      responseType: "success",
      message: "Draft saved",
    });
  } catch (error: unknown) {
    const e = error as { message?: string; code?: string; metadata?: unknown };
    return parseStringify({
      responseType: "error",
      message: e?.message ?? "Failed to save draft",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: e?.code,
      metadata: e?.metadata,
    });
  }
}

/**
 * Promote a draft stock item to published. The backend revalidates that
 * the stock now has a real name and at least one variant before flipping
 * the draft flag and firing the deferred STOCK_ITEM_CREATED Kafka event.
 * Idempotent for already-published stocks.
 */
export async function publishStock(
  stockId: string,
): Promise<FormResponse | void> {
  if (!stockId) throw new Error("Stock ID is required");

  try {
    const apiClient = new ApiClient();
    const published = (await apiClient.post(
      inventoryUrl(`/api/v1/stocks/${stockId}/publish`),
      {},
    )) as Stock;

    revalidatePath("/stock-variants");
    revalidatePath(`/stock-variants/${stockId}`);
    return parseStringify({
      responseType: "success",
      message: "Stock published",
      data: published,
    });
  } catch (error: unknown) {
    const e = error as { message?: string; code?: string; metadata?: unknown };
    return parseStringify({
      responseType: "error",
      message: e?.message ?? "Failed to publish stock",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: e?.code,
      metadata: e?.metadata,
    });
  }
}
