"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {
  getAuthenticatedUser,
  deleteActiveBusinessCookie,
  deleteActiveLocationCookie,
} from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentLocation } from "./business/get-current-business";
import {
  Product,
  PriceOverrideResponse,
  SoldItemsReport,
  TopSellingProduct,
} from "@/types/product/type";
import {
  ProductSchema,
  type ProductVariantInput,
  PriceOverrideSchema,
} from "@/types/product/schema";
import { GoogleGenAI } from "@google/genai";
import { LocationDetails } from "@/types/menu/type";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";

// ── Sellability mode mapping ────────────────────────────────────────
//
// The form models each variant's intent as a single `sellabilityMode` enum
// (UNLIMITED / DIRECT / RECIPE). The Inventory Service stores this as three
// related fields on the variant + one on the product, with non-trivial
// validation between them. Encapsulate the mapping here so callers don't
// have to think about the triple every time.

type VariantPayload = {
  name: string;
  sku?: string | null;
  imageUrl?: string | null;
  active?: boolean;
  pricingStrategy: "MANUAL" | "PERCENTAGE_MARKUP" | "FIXED_MARKUP";
  price: number;
  costPrice?: number | null;
  markupPercentage?: number | null;
  markupAmount?: number | null;
  unlimited: boolean;
  availableQuantity?: number | null;
  stockLinkType?: "DIRECT" | null;
  stockVariantId?: string | null;
  directQuantity?: number | null;
};

function mapVariant(v: ProductVariantInput): VariantPayload {
  const base: VariantPayload = {
    name: v.name,
    sku: v.sku || undefined,
    imageUrl: v.imageUrl || undefined,
    active: v.active,
    pricingStrategy: v.pricingStrategy,
    price: v.price,
    costPrice: v.costPrice ?? undefined,
    markupPercentage:
      v.pricingStrategy === "PERCENTAGE_MARKUP" ? v.markupPercentage ?? undefined : undefined,
    markupAmount:
      v.pricingStrategy === "FIXED_MARKUP" ? v.markupAmount ?? undefined : undefined,
    unlimited: false,
  };

  switch (v.sellabilityMode) {
    case "UNLIMITED":
      return {
        ...base,
        unlimited: true,
        availableQuantity: v.availableQuantity ?? undefined,
      };
    case "DIRECT":
      return {
        ...base,
        unlimited: false,
        stockLinkType: "DIRECT",
        stockVariantId: v.stockVariantId ?? undefined,
        directQuantity: v.directQuantity ?? undefined,
      };
    case "RECIPE":
      return {
        ...base,
        unlimited: false,
        // stockLinkType intentionally null — the BOM rule is the link
      };
  }
}

// trackStock is derived: false only when every variant is UNLIMITED.
function deriveTrackStock(variants: ProductVariantInput[]): boolean {
  return variants.some((v) => v.sellabilityMode !== "UNLIMITED");
}

// ── Products: list + read ───────────────────────────────────────────

export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/products?size=200"));
    const page = parseStringify(data) as ApiResponse<Product>;
    return page.content;
  } catch (error) {
    throw error;
  }
}

export async function searchProducts(
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Product>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (q) params.set("name", q);
    // Server is 0-indexed; the dashboard pager is 1-indexed.
    params.set("page", String(page ? page - 1 : 0));
    params.set("size", String(pageLimit || 10));
    params.set("sortBy", "createdAt");
    params.set("sortDirection", "DESC");

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/products?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function getProduct(id: string): Promise<Product> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`/api/v1/products/${id}`));
  return parseStringify(data);
}

// ── Products: create / update / delete ──────────────────────────────

export async function createProduct(
  product: z.infer<typeof ProductSchema>,
): Promise<FormResponse | void> {
  const validData = ProductSchema.safeParse(product);

  if (!validData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const destination = await getCurrentDestination();

    const created = (await apiClient.post(inventoryUrl("/api/v1/products"), {
      locationType: destination?.type ?? "LOCATION",
      name: validData.data.name,
      nativeCurrency: validData.data.nativeCurrency,
      description: validData.data.description || undefined,
      categoryIds: validData.data.categoryIds,
      brandId: validData.data.brandId || undefined,
      imageUrl: validData.data.imageUrl || undefined,
      sellOnline: validData.data.sellOnline,
      trackStock: deriveTrackStock(validData.data.variants),
      taxInclusive: validData.data.taxInclusive,
      taxClass: validData.data.taxClass || undefined,
      tags: validData.data.tags,
      variants: validData.data.variants.map(mapVariant),
      modifierGroupIds: validData.data.modifierGroupIds?.length
        ? validData.data.modifierGroupIds
        : undefined,
      addonGroupIds: validData.data.addonGroupIds?.length
        ? validData.data.addonGroupIds
        : undefined,
    })) as Product;

    revalidatePath("/products");
    // Redirect to edit so merchant can immediately add modifiers/addons/overrides.
    redirect(`/products/${created.id}/edit`);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create product",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: error?.code,
      metadata: error?.metadata,
    });
  }
}

/**
 * Create a product AND a 1:1 stock item in one atomic backend call.
 *
 * The merchant's mental model is "I sell X, I track X" — they shouldn't
 * have to round-trip through the stock catalog before creating a
 * sellable product. When `autoCreateStock` is on the product form, this
 * calls the combined endpoint instead of `/products`. The backend is
 * expected to:
 *   1. Create the stock item (one stock variant per product variant).
 *   2. Create the product with each variant linked to its matching
 *      stock variant via stockLinkType=DIRECT.
 *   3. Roll both back if either side fails.
 *
 * Recipe-mode and existing-stock links remain available with the toggle
 * off; this path is the fast 1:1 default.
 *
 * Endpoint: POST /api/v1/products/with-stock (backend wiring pending).
 */
export async function createProductWithStock(
  product: z.infer<typeof ProductSchema>,
  stockOptions?: {
    baseUnitId?: string;
    materialType?: string;
    initialQuantity?: number;
    initialUnitCost?: number;
  },
): Promise<FormResponse | void> {
  const validData = ProductSchema.safeParse(product);

  if (!validData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const destination = await getCurrentDestination();

    const payload = {
      locationType: destination?.type ?? "LOCATION",
      name: validData.data.name,
      nativeCurrency: validData.data.nativeCurrency,
      description: validData.data.description || undefined,
      categoryIds: validData.data.categoryIds,
      brandId: validData.data.brandId || undefined,
      imageUrl: validData.data.imageUrl || undefined,
      sellOnline: validData.data.sellOnline,
      // Auto-tracking always tracks stock — every variant gets a 1:1 link.
      trackStock: true,
      taxInclusive: validData.data.taxInclusive,
      taxClass: validData.data.taxClass || undefined,
      tags: validData.data.tags,
      // Force every variant into DIRECT mode without a stockVariantId — the
      // backend creates the matching stock variant on the fly and links
      // them by index. directQuantity defaults to 1 if not set.
      variants: validData.data.variants.map((v) => ({
        ...mapVariant(v),
        unlimited: false,
        stockLinkType: "DIRECT" as const,
        stockVariantId: undefined,
        directQuantity: v.directQuantity ?? 1,
      })),
      modifierGroupIds: validData.data.modifierGroupIds?.length
        ? validData.data.modifierGroupIds
        : undefined,
      addonGroupIds: validData.data.addonGroupIds?.length
        ? validData.data.addonGroupIds
        : undefined,
      autoCreateStock: true,
      stock: {
        baseUnitId: stockOptions?.baseUnitId,
        materialType: stockOptions?.materialType ?? "FINISHED_GOOD",
        initialQuantity: stockOptions?.initialQuantity,
        initialUnitCost: stockOptions?.initialUnitCost,
      },
    };

    const created = (await apiClient.post(
      inventoryUrl("/api/v1/products/with-stock"),
      payload,
    )) as Product;

    revalidatePath("/products");
    revalidatePath("/stock-variants");
    redirect(`/products/${created.id}/edit`);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create product with stock",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: error?.code,
      metadata: error?.metadata,
    });
  }
}

/**
 * Update product-level fields. Variants are managed via the dedicated
 * variant CRUD calls (createVariant / updateVariant / deleteVariant) —
 * this endpoint intentionally does not accept a variants array.
 *
 * trackStock is derived from the supplied variants when provided so the
 * product flag stays in sync with the variant set the form is showing.
 */
export async function updateProduct(
  productId: string,
  product: z.infer<typeof ProductSchema>,
): Promise<FormResponse | void> {
  const validData = ProductSchema.safeParse(product);

  if (!validData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();

    await apiClient.put(inventoryUrl(`/api/v1/products/${productId}`), {
      name: validData.data.name,
      nativeCurrency: validData.data.nativeCurrency,
      description: validData.data.description || undefined,
      categoryIds: validData.data.categoryIds,
      brandId: validData.data.brandId || undefined,
      imageUrl: validData.data.imageUrl || undefined,
      sellOnline: validData.data.sellOnline,
      trackStock: deriveTrackStock(validData.data.variants),
      taxInclusive: validData.data.taxInclusive,
      taxClass: validData.data.taxClass || undefined,
      tags: validData.data.tags,
      active: validData.data.active,
      lifecycleStatus: validData.data.lifecycleStatus,
      replacementProductId: validData.data.replacementProductId || undefined,
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}/edit`);
    redirect(`/products/${productId}/edit`);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update product",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: error?.code,
      metadata: error?.metadata,
    });
  }
}

export async function deleteProduct(id: string): Promise<void> {
  if (!id) throw new Error("Product ID is required");
  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/products/${id}`));
  revalidatePath("/products");
}

// archiveProduct preserves the legacy signature (ids: string | string[])
// so cell-action and other callers don't need a coordinated change. Hits
// the dedicated /archive endpoint per id.
export async function archiveProduct(ids: string | string[]): Promise<void> {
  const apiClient = new ApiClient();
  const productIds = Array.isArray(ids) ? ids : [ids];
  for (const id of productIds) {
    await apiClient.post(inventoryUrl(`/api/v1/products/${id}/archive`), {});
  }
  revalidatePath("/products");
}

export async function unarchiveProduct(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/products/${id}/unarchive`), {});
  revalidatePath("/products");
}

// ── Variants ────────────────────────────────────────────────────────

export async function createVariant(
  productId: string,
  variant: ProductVariantInput,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/products/${productId}/variants`),
    mapVariant(variant),
  );
  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
}

export async function updateVariant(
  productId: string,
  variantId: string,
  variant: ProductVariantInput,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/products/${productId}/variants/${variantId}`),
    mapVariant(variant),
  );
  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
}

export async function deleteVariant(
  productId: string,
  variantId: string,
): Promise<void> {
  if (!productId || !variantId)
    throw new Error("Product and variant IDs are required");
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/products/${productId}/variants/${variantId}`),
  );
  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
}

export async function archiveVariant(
  productId: string,
  variantId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/products/${productId}/variants/${variantId}/archive`),
    {},
  );
  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
}

export async function unarchiveVariant(
  productId: string,
  variantId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/products/${productId}/variants/${variantId}/unarchive`),
    {},
  );
  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
}

// ── Currency price overrides (per variant) ──────────────────────────

export async function listPriceOverrides(
  productId: string,
  variantId: string,
): Promise<PriceOverrideResponse[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/products/${productId}/variants/${variantId}/price-overrides`),
    );
    return parseStringify(data);
  } catch {
    return [];
  }
}

export async function upsertPriceOverride(
  productId: string,
  variantId: string,
  input: z.infer<typeof PriceOverrideSchema>,
): Promise<FormResponse | void> {
  const valid = PriceOverrideSchema.safeParse(input);
  if (!valid.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(valid.error.message),
    });
  }
  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      inventoryUrl(
        `/api/v1/products/${productId}/variants/${variantId}/price-overrides/${valid.data.currency}`,
      ),
      { price: valid.data.price, notes: valid.data.notes || undefined },
    );
    revalidatePath(`/products/${productId}/edit`);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to save price override",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function removePriceOverride(
  productId: string,
  variantId: string,
  currency: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(
      `/api/v1/products/${productId}/variants/${variantId}/price-overrides/${currency.toUpperCase()}`,
    ),
  );
  revalidatePath(`/products/${productId}/edit`);
}

// ── Bulk Price Update ───────────────────────────────────────────────

export async function bulkPriceUpdate(
  updates: { productVariantId: string; price: number }[],
): Promise<unknown> {
  const apiClient = new ApiClient();
  return apiClient.put(inventoryUrl("/api/v1/products/bulk-price"), { updates });
}

// Modifier and addon helpers moved to dedicated server-action modules:
//   @/lib/actions/modifier-actions  (library + per-product attach)
//   @/lib/actions/addon-actions     (library + per-product attach)
// Both reflect the post-V31 backend where groups are business-scoped
// and attached to products via a join — the previous nested helpers
// pointed at endpoints that no longer exist.

// ── Reports (kept — these hit a different service) ──────────────────

export const productSummary = async (): Promise<any> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();
    const data = await apiClient.get(
      `/api/reports/${location?.id}/products/summary`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const topSellingProduct = async (
  startDate?: Date,
  endDate?: Date,
  limit?: number,
): Promise<TopSellingProduct | null> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();
    const topSelling = await apiClient.get(
      `/api/reports/${location?.id}/products/top-selling`,
      { params: { startDate, endDate, limit } },
    );
    return parseStringify(topSelling);
  } catch (error) {
    throw error;
  }
};

export const SoldItemsReports = async (
  startDate?: Date,
  endDate?: Date,
): Promise<SoldItemsReport | null> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();
    const soldItems = await apiClient.get(
      `/api/reports/${location?.id}/products/sold-items`,
      { params: { startDate, endDate } },
    );
    return parseStringify(soldItems);
  } catch (error) {
    throw error;
  }
};

// ── AI Description (Gemini) ─────────────────────────────────────────

export const generateAIDescription = async (
  name: string,
  category: string,
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `Generate a concise product description for "${name}" in the ${category} category.
Requirements:
- Maximum 3-4 sentences
- Focus on 2-3 key benefits/features only
- Use simple, clear language
- Start with what the product does
- Keep it under 150 words`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    return response.text ?? "No description generated";
  } catch {
    return "No description generated";
  }
};

// ── CSV Upload/Download (kept — hits Rust service) ──────────────────

export const uploadProductCSV = async ({
  fileData,
  fileName,
}: {
  fileData: string;
  fileName: string;
}): Promise<void> => {
  if (!fileName.endsWith(".csv")) {
    throw new Error("Invalid file type. Please upload a CSV file.");
  }

  const formattedCSVData = fileData.replace(/\r\n/g, "\n");

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.post(
      `/rust/csv-uploading/upload-products-csv?location_id=${location?.id}`,
      formattedCSVData,
      {
        headers: { "Content-Type": "text/csv" },
        transformRequest: [(data: string) => data],
      },
    );
  } catch (error: any) {
    if (
      error.code === "FORBIDDEN" &&
      error.message?.includes("beyond the limit")
    ) {
      const limitMatch = error.message.match(/limit is (\d+)/);
      const wantedMatch = error.message.match(/total of (\d+)/);
      throw new Error(
        `Subscription limit exceeded. Your plan allows up to ${limitMatch?.[1] ?? "?"} products, but you attempted ${wantedMatch?.[1] ?? "too many"}.`,
      );
    }
    throw new Error(
      `Failed to upload CSV: ${error?.message || "Please try again."}`,
    );
  }
  revalidatePath("/products");
};

export const downloadProductsCSV = async (locationId?: string) => {
  const location = (await getCurrentLocation()) || { id: locationId };
  try {
    const apiClient = new ApiClient();
    return await apiClient.get(
      `/rust/csv-downloading/download-products-csv?location_id=${location?.id}`,
    );
  } catch (error) {
    throw new Error(
      `Failed to download CSV: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

// ── Menu (kept — different service) ─────────────────────────────────

export const menuProducts = async (
  q: string,
  page: number,
  pageLimit: number,
  locationId?: string,
): Promise<ApiResponse<Product>> => {
  try {
    const apiClient = new ApiClient();
    const query = {
      filters: [
        { key: "name", operator: "LIKE", field_type: "STRING", value: q },
        {
          key: "isArchived",
          operator: "EQUAL",
          field_type: "BOOLEAN",
          value: false,
        },
      ],
      sorts: [{ key: "name", direction: "ASC" }],
      page: Math.max(page ? page - 1 : 0, 0),
      size: pageLimit ? Math.min(pageLimit, 100) : 10,
    };

    await deleteActiveBusinessCookie();
    await deleteActiveLocationCookie();

    const data = await apiClient.post(`/api/menu/${locationId}`, query, {
      headers: {
        "SETTLO-API-KEY":
          "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a",
      },
    });
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const locationMenuDetails = async (
  locationId?: string,
): Promise<LocationDetails> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<LocationDetails>(
      `/api/menu/${locationId}`,
      {
        headers: {
          "SETTLO-API-KEY":
            "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a",
        },
      },
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

// ── Multi-image upload (STUB) ───────────────────────────────────────
// TODO(images): wire up to the real asset/CDN service. The product form
// collects up to 5 images with a primary index; the UI feeds files in as
// data URLs for preview. This stub echoes those data URLs back so the
// flow works end-to-end pre-backend. Replace the body with a real upload
// (e.g. multipart POST → S3/GCS) and return the public URLs.
export async function uploadProductImages(
  dataUrls: string[],
): Promise<string[]> {
  // eslint-disable-next-line no-console
  console.warn(
    "[uploadProductImages] STUB — returning input data URLs. Wire this up to the asset service.",
  );
  return dataUrls;
}

// ── Save as draft (STUB) ────────────────────────────────────────────
// TODO(drafts): wire up real draft persistence. The product form's
// "Save as draft" button calls this with the in-progress form values
// (validation deliberately bypassed) so merchants can park work without
// satisfying every required field. Replace the body with a backend call
// that stores a draft record (separate table or product flag) without
// going through ProductSchema's strict validation.
export async function saveProductDraft(
  values: unknown,
  productId?: string,
): Promise<FormResponse> {
  // Mark the parameters as "intentionally unused for now" so the stub keeps
  // the right shape for the real implementation. Drop the void casts when
  // wiring this up.
  void values;
  void productId;
  // eslint-disable-next-line no-console
  console.warn(
    "[saveProductDraft] STUB — drafts are not yet wired up on the backend.",
  );
  return parseStringify({
    responseType: "error",
    message: "Drafts are not yet wired up on the backend.",
    error: new Error("saveProductDraft not implemented"),
  });
}
