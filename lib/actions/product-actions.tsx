"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {
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
} from "@/types/product/type";
import type {
  ListTopSellingParams,
  TopSellingReport,
} from "@/types/reports/top-selling";
import type {
  ListSoldItemsParams,
  SoldItemsReport,
} from "@/types/reports/sold-items";
import {
  ProductSchema,
  type ProductVariantInput,
  PriceOverrideSchema,
} from "@/types/product/schema";
import { GoogleGenAI } from "@google/genai";
import { LocationDetails } from "@/types/menu/type";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";
import { attachBomRule } from "./bom-rule-actions";

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
  // Optional barcode — backend treats blank as "leave alone" on update,
  // null/undefined as "don't touch", and a non-blank value as "set this
  // (must be unique across the location)".
  barcode?: string | null;
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
  // Auto-retire-on-sellout (V36): forwarded straight to the backend.
  // Only meaningful for tracked variants — the order consumer reads it
  // when a DIRECT-link deduction empties the stock.
  autoRetireOnSellout?: boolean;
  // FK to a TaxType in the Accounting Service. Backend treats null as
  // exempt; on update, omitting the field leaves the existing value
  // unchanged (PATCH semantics).
  taxTypeId?: string | null;
};

// taxTypeId now lives at the product level. The backend still stores it
// per-variant, so callers thread the product's tax type through here
// and we stamp the same id onto every variant payload.
function mapVariant(
  v: ProductVariantInput,
  taxTypeId: string | null | undefined,
): VariantPayload {
  const base: VariantPayload = {
    name: v.name,
    sku: v.sku || undefined,
    barcode: v.barcode || undefined,
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
    autoRetireOnSellout: v.autoRetireOnSellout ?? false,
    taxTypeId: taxTypeId ?? undefined,
  };

  switch (v.sellabilityMode) {
    case "UNLIMITED":
      return {
        ...base,
        unlimited: true,
      };
    case "QUANTITY":
      return {
        ...base,
        unlimited: false,
        // Self-managed counter; backend decrements on sale (no stock ledger).
        availableQuantity: v.availableQuantity ?? 0,
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

// trackStock is true only when at least one variant ties to a stock item or
// recipe. UNLIMITED and QUANTITY both leave the product untracked — the
// QUANTITY counter lives on the variant, separate from the stock ledger.
function deriveTrackStock(variants: ProductVariantInput[]): boolean {
  return variants.some(
    (v) => v.sellabilityMode === "DIRECT" || v.sellabilityMode === "RECIPE",
  );
}

/**
 * Fan out attachBomRule() per RECIPE-mode variant whose form state
 * carries a {@code bomRuleId}. Resolves the variant id from {@code created}
 * (positional match) when present — the create flow's response — falls
 * back to the input variant's own id (edit flow).
 *
 * Failures are intentionally swallowed and logged: the product save
 * already succeeded, the operator can re-attach manually if a single
 * binding fails. Rolling the product back over a stray attach error
 * would be unhelpful.
 */
async function attachRecipesForVariants(
  inputs: ProductVariantInput[],
  created: { id: string }[] | undefined,
): Promise<void> {
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const ruleId = input.bomRuleId;
    if (!ruleId) continue;
    const variantId = created?.[i]?.id ?? input.id;
    if (!variantId) continue;
    try {
      await attachBomRule(ruleId, { productVariantId: variantId });
    } catch (e) {
      console.warn(
        `Recipe attach failed for variant ${variantId} → rule ${ruleId}:`,
        e,
      );
    }
  }
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

// Tab-aligned view filter mirroring the backend's ProductListView enum.
// The dashboard sends one of these values per merchant tab and renders
// the response unchanged — no client-side row filtering.
export type ProductView = "active" | "archived" | "draft" | "all";

export async function searchProducts(
  q: string,
  page: number,
  pageLimit: number,
  view?: ProductView,
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
    // Tab filter — backend's ProductController.getAll routes ?view= to
    // the matching repository finder (active+not-archived, archived,
    // drafts, or every non-deleted row).
    if (view) params.set("view", view.toUpperCase());

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

// Per-tab counts powering the merchant tab badges on /products.
// One round-trip replaces the prior pattern of inferring counts from a
// full list fetch.
export interface ProductListCounts {
  active: number;
  archived: number;
  draft: number;
  all: number;
}

export async function getProductCounts(): Promise<ProductListCounts> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl("/api/v1/products/counts"),
    );
    return parseStringify(data) as ProductListCounts;
  } catch {
    return { active: 0, archived: 0, draft: 0, all: 0 };
  }
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
      imageUrls: validData.data.imageUrls,
      sellOnline: validData.data.sellOnline,
      trackStock: deriveTrackStock(validData.data.variants),
      taxInclusive: validData.data.taxInclusive,
      tags: validData.data.tags,
      variants: validData.data.variants.map((v) =>
        mapVariant(v, validData.data.taxTypeId),
      ),
      modifierGroupIds: validData.data.modifierGroupIds?.length
        ? validData.data.modifierGroupIds
        : undefined,
      addonGroupIds: validData.data.addonGroupIds?.length
        ? validData.data.addonGroupIds
        : undefined,
    })) as Product;

    await attachRecipesForVariants(validData.data.variants, created.variants);

    revalidatePath("/products");
    redirect(`/products/${created.id}`);
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
      imageUrls: validData.data.imageUrls,
      sellOnline: validData.data.sellOnline,
      // Auto-tracking always tracks stock — every variant gets a 1:1 link.
      trackStock: true,
      taxInclusive: validData.data.taxInclusive,
      tags: validData.data.tags,
      // Force every variant into DIRECT mode without a stockVariantId — the
      // backend creates the matching stock variant on the fly and links
      // them by index. directQuantity defaults to 1 if not set.
      variants: validData.data.variants.map((v) => ({
        ...mapVariant(v, validData.data.taxTypeId),
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
    redirect(`/products/${created.id}`);
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
      // Empty list clears the gallery on the backend; omit the field
      // entirely (undefined) to leave it untouched.
      imageUrls: validData.data.imageUrls,
      sellOnline: validData.data.sellOnline,
      trackStock: deriveTrackStock(validData.data.variants),
      taxInclusive: validData.data.taxInclusive,
      tags: validData.data.tags,
      active: validData.data.active,
      lifecycleStatus: validData.data.lifecycleStatus,
      replacementProductId: validData.data.replacementProductId || undefined,
    });

    // Existing variants already carry their ids in form state — no
    // mapping pass needed. Newly-added variants in edit mode aren't
    // covered here yet (the PUT doesn't return the updated variant
    // list); operators editing the variant set should attach via the
    // recipe form for now.
    await attachRecipesForVariants(validData.data.variants, undefined);

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/products/${productId}/edit`);
    redirect(`/products/${productId}`);
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
  taxTypeId: string | null | undefined,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/products/${productId}/variants`),
    mapVariant(variant, taxTypeId),
  );
  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
}

export async function updateVariant(
  productId: string,
  variantId: string,
  variant: ProductVariantInput,
  taxTypeId: string | null | undefined,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/products/${productId}/variants/${variantId}`),
    mapVariant(variant, taxTypeId),
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

/**
 * Top-selling products report.
 *
 * Backed by `GET /api/v2/analytics/item-sales/top-selling` on the
 * reports service. The response shape mirrors `TopSellingReport` 1:1
 * so we only need to forward query params and pass the JSON through
 * `parseStringify`.
 */
export const listTopSellingProducts = async (
  params?: ListTopSellingParams,
): Promise<TopSellingReport | null> => {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return null;

    const apiClient = new ApiClient("reports");
    const data = await apiClient.get<TopSellingReport>(
      `/api/v2/analytics/item-sales/top-selling`,
      {
        params: {
          locationId: location.id,
          fromDate: params?.fromDate,
          toDate: params?.toDate,
          sortBy: params?.sortBy,
          limit: params?.limit,
        },
      },
    );
    return parseStringify(data);
  } catch (error) {
    console.error("[listTopSellingProducts] request failed", error);
    return null;
  }
};

/**
 * Sold-items report.
 *
 * Backed by `GET /api/v2/analytics/item-sales/sold-items` on the
 * reports service. Returns line-level data (one row per OrderItem) so
 * an operator can audit exactly what physically went out the door,
 * including voided lines. Money fields are intentionally absent — this
 * is a volume / audit screen.
 */
export const listSoldItems = async (
  params?: ListSoldItemsParams,
): Promise<SoldItemsReport | null> => {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return null;

    const apiClient = new ApiClient("reports");
    const data = await apiClient.get<SoldItemsReport>(
      `/api/v2/analytics/item-sales/sold-items`,
      {
        params: {
          locationId: location.id,
          fromDate: params?.fromDate,
          toDate: params?.toDate,
          status: params?.status,
          categoryId: params?.categoryId,
          staffId: params?.staffId,
          limit: params?.limit,
        },
      },
    );
    return parseStringify(data);
  } catch (error) {
    console.error("[listSoldItems] request failed", error);
    return null;
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

// CSV upload + download were migrated off the Rust service. Upload is now
// handled by /api/v1/imports — see lib/actions/import-actions.ts. The
// product-CSV export is not yet re-implemented in the inventory service.

export const downloadProductsCSV = async (_locationId?: string): Promise<Blob | string> => {
  throw new Error("Product CSV export is not available yet.");
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

// ── Save as draft ───────────────────────────────────────────────────
//
// Persists the in-progress form state without enforcing ProductSchema's
// validation. Two flavors:
//   - First save (no productId): POST /api/v1/products with draft=true.
//     Backend swaps in a placeholder name when blank, skips the categories
//     and variants requirements, and suppresses the PRODUCT_CREATED Kafka
//     fan-out until publish.
//   - Subsequent save (productId set): PUT /api/v1/products/{id} with
//     whatever top-level fields are filled. Variants are managed through
//     the dedicated /variants endpoints — the same separation as the
//     regular update flow.
//
// The response carries the persisted product so the form can pin the new
// id and switch into edit mode without a full reload.
type DraftProductInput = Partial<z.infer<typeof ProductSchema>>;

function mapVariantPartial(
  v: Partial<ProductVariantInput>,
  taxTypeId: string | null | undefined,
) {
  // Drafts may have wholly empty rows; skip those upstream. Anything else
  // we forward as-is, letting the backend's draft path apply placeholders.
  const sellMode = v.sellabilityMode ?? "UNLIMITED";
  return {
    name: v.name?.trim() || undefined,
    sku: v.sku || undefined,
    barcode: v.barcode || undefined,
    imageUrl: v.imageUrl || undefined,
    active: v.active,
    pricingStrategy: v.pricingStrategy,
    price: v.price ?? undefined,
    costPrice: v.costPrice ?? undefined,
    markupPercentage:
      v.pricingStrategy === "PERCENTAGE_MARKUP" ? v.markupPercentage ?? undefined : undefined,
    markupAmount:
      v.pricingStrategy === "FIXED_MARKUP" ? v.markupAmount ?? undefined : undefined,
    unlimited: sellMode === "UNLIMITED",
    availableQuantity:
      sellMode === "QUANTITY" ? v.availableQuantity ?? 0 : undefined,
    stockLinkType: sellMode === "DIRECT" ? "DIRECT" : undefined,
    stockVariantId: sellMode === "DIRECT" ? v.stockVariantId ?? undefined : undefined,
    directQuantity: sellMode === "DIRECT" ? v.directQuantity ?? undefined : undefined,
    // Forward the toggle for tracked variants only — UNLIMITED ignores
    // it on the backend, no point sending it.
    autoRetireOnSellout:
      sellMode !== "UNLIMITED" ? v.autoRetireOnSellout ?? undefined : undefined,
    taxTypeId: taxTypeId ?? undefined,
  };
}

export async function saveProductDraft(
  values: DraftProductInput,
  productId?: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    const destination = await getCurrentDestination();

    const variantsArray = Array.isArray(values.variants) ? values.variants : [];
    const meaningfulVariants = variantsArray
      .map((v) => v as Partial<ProductVariantInput>)
      .filter((v) => v && (v.name?.trim() || v.sku || v.price != null))
      .map((v) => mapVariantPartial(v, values.taxTypeId));

    const imageUrls = values.imageUrls && values.imageUrls.length
      ? values.imageUrls
      : undefined;
    const categoryIds = Array.isArray(values.categoryIds) && values.categoryIds.length
      ? values.categoryIds
      : undefined;
    const tags = Array.isArray(values.tags) && values.tags.length ? values.tags : undefined;

    if (!productId) {
      // Fresh draft — backend assigns an id and stamps draft=true.
      const payload = {
        locationType: destination?.type ?? "LOCATION",
        name: values.name?.trim() || undefined,
        nativeCurrency: values.nativeCurrency || undefined,
        description: values.description || undefined,
        categoryIds,
        brandId: values.brandId || undefined,
        imageUrls,
        sellOnline: values.sellOnline,
        taxInclusive: values.taxInclusive,
        tags,
        variants: meaningfulVariants.length ? meaningfulVariants : undefined,
        modifierGroupIds: values.modifierGroupIds?.length
          ? values.modifierGroupIds
          : undefined,
        addonGroupIds: values.addonGroupIds?.length ? values.addonGroupIds : undefined,
        draft: true,
      };

      const created = (await apiClient.post(
        inventoryUrl("/api/v1/products"),
        payload,
      )) as Product;

      revalidatePath("/products");
      return parseStringify({
        responseType: "success",
        message: "Draft saved",
        data: created,
      });
    }

    // Existing draft — only top-level fields go through PUT. Variants stay
    // owned by the dedicated /variants endpoints, mirroring the regular
    // updateProduct flow.
    await apiClient.put(inventoryUrl(`/api/v1/products/${productId}`), {
      name: values.name?.trim() || undefined,
      nativeCurrency: values.nativeCurrency || undefined,
      description: values.description ?? undefined,
      categoryIds,
      brandId: values.brandId || undefined,
      imageUrls,
      sellOnline: values.sellOnline,
      taxInclusive: values.taxInclusive,
      tags,
      replacementProductId: values.replacementProductId || undefined,
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}/edit`);
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
 * Promote a draft product to ACTIVE. The backend revalidates that the
 * product now has a real name, at least one category, and at least one
 * priced variant before flipping the lifecycle flag and firing the
 * deferred PRODUCT_CREATED Kafka event. Idempotent for already-published
 * products.
 */
export async function publishProduct(
  productId: string,
): Promise<FormResponse | void> {
  if (!productId) throw new Error("Product ID is required");

  try {
    const apiClient = new ApiClient();
    const published = (await apiClient.post(
      inventoryUrl(`/api/v1/products/${productId}/publish`),
      {},
    )) as Product;

    revalidatePath("/products");
    revalidatePath(`/products/${productId}/edit`);
    return parseStringify({
      responseType: "success",
      message: "Product published",
      data: published,
    });
  } catch (error: unknown) {
    const e = error as { message?: string; code?: string; metadata?: unknown };
    return parseStringify({
      responseType: "error",
      message: e?.message ?? "Failed to publish product",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: e?.code,
      metadata: e?.metadata,
    });
  }
}
