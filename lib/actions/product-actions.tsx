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
  SoldItemsReport,
  TopSellingProduct,
} from "@/types/product/type";
import { ProductSchema } from "@/types/product/schema";
import { GoogleGenAI } from "@google/genai";
import { LocationDetails } from "@/types/menu/type";
import { inventoryUrl } from "./inventory-client";

// ── Products CRUD (Inventory Service) ───────────────────────────────

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
    params.set("page", String(page ? page - 1 : 0));
    params.set("size", String(pageLimit || 10));
    params.set("sortBy", "createdAt");
    params.set("sortDirection", "DESC");
    params.set("active", "true");

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/products?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

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
    await apiClient.post(inventoryUrl("/api/v1/products"), {
      locationType: "LOCATION",
      name: validData.data.name,
      description: validData.data.description,
      categoryIds: validData.data.categoryIds,
      departmentId: validData.data.departmentId,
      brandId: validData.data.brandId,
      imageUrl: validData.data.imageUrl,
      sellOnline: validData.data.sellOnline,
      trackStock: validData.data.trackStock,
      taxInclusive: validData.data.taxInclusive,
      taxClass: validData.data.taxClass,
      tags: validData.data.tags,
      variants: validData.data.variants.map((v) => ({
        name: v.name,
        sku: v.sku,
        imageUrl: v.imageUrl,
        pricingStrategy: v.pricingStrategy || "MANUAL",
        price: v.price,
        costPrice: v.costPrice,
        markupPercentage: v.markupPercentage,
        markupAmount: v.markupAmount,
        unlimited: v.unlimited,
        stockLinkType: v.stockLinkType,
        stockVariantId: v.stockVariantId,
        directQuantity: v.directQuantity,
        consumptionRuleId: v.consumptionRuleId,
      })),
    });

    revalidatePath("/products");
    redirect("/products");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create product",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function getProduct(id: string): Promise<Product> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`/api/v1/products/${id}`));
  return parseStringify(data);
}

export async function updateProduct(
  productId: string,
  product: z.infer<typeof ProductSchema>,
  paginationState?: { pageIndex: number; pageSize: number } | null,
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
      description: validData.data.description,
      categoryIds: validData.data.categoryIds,
      departmentId: validData.data.departmentId,
      brandId: validData.data.brandId,
      imageUrl: validData.data.imageUrl,
      sellOnline: validData.data.sellOnline,
      trackStock: validData.data.trackStock,
      taxInclusive: validData.data.taxInclusive,
      taxClass: validData.data.taxClass,
      tags: validData.data.tags,
      active: validData.data.active,
      lifecycleStatus: validData.data.lifecycleStatus,
    });

    revalidatePath("/products");

    if (paginationState) {
      const page = paginationState.pageIndex + 1;
      const limit = paginationState.pageSize;
      redirect(`/products?page=${page}&limit=${limit}`);
    } else {
      redirect("/products");
    }
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update product",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteProduct(id: string): Promise<void> {
  if (!id) throw new Error("Product ID is required");
  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/products/${id}`));
  revalidatePath("/products");
}

// ── Variants CRUD (nested under product) ────────────────────────────

export async function createVariant(
  productId: string,
  variant: Record<string, unknown>,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/products/${productId}/variants`),
    variant,
  );
  revalidatePath("/products");
}

export async function updateVariant(
  productId: string,
  variantId: string,
  variant: Record<string, unknown>,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/products/${productId}/variants/${variantId}`),
    variant,
  );
  revalidatePath("/products");
}

export async function deleteVariant(
  productId: string,
  variantId: string,
): Promise<void> {
  if (!productId || !variantId) throw new Error("Product and variant IDs are required");
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/products/${productId}/variants/${variantId}`),
  );
  revalidatePath("/products");
}

// ── Modifier Groups CRUD (nested under product) ─────────────────────

export async function getModifierGroups(productId: string) {
  const apiClient = new ApiClient();
  return apiClient.get(inventoryUrl(`/api/v1/products/${productId}/modifier-groups`));
}

export async function createModifierGroup(
  productId: string,
  data: Record<string, unknown>,
) {
  const apiClient = new ApiClient();
  const result = await apiClient.post(
    inventoryUrl(`/api/v1/products/${productId}/modifier-groups`),
    data,
  );
  revalidatePath("/products");
  return result;
}

export async function updateModifierGroup(
  productId: string,
  groupId: string,
  data: Record<string, unknown>,
) {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/products/${productId}/modifier-groups/${groupId}`),
    data,
  );
  revalidatePath("/products");
}

export async function deleteModifierGroup(productId: string, groupId: string) {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/products/${productId}/modifier-groups/${groupId}`),
  );
  revalidatePath("/products");
}

export async function createModifierOption(
  productId: string,
  groupId: string,
  data: Record<string, unknown>,
) {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/products/${productId}/modifier-groups/${groupId}/options`),
    data,
  );
  revalidatePath("/products");
}

export async function updateModifierOption(
  productId: string,
  groupId: string,
  optionId: string,
  data: Record<string, unknown>,
) {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/products/${productId}/modifier-groups/${groupId}/options/${optionId}`),
    data,
  );
  revalidatePath("/products");
}

export async function deleteModifierOption(
  productId: string,
  groupId: string,
  optionId: string,
) {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/products/${productId}/modifier-groups/${groupId}/options/${optionId}`),
  );
  revalidatePath("/products");
}

// ── Addon Groups CRUD (nested under product) ────────────────────────

export async function getAddonGroups(productId: string) {
  const apiClient = new ApiClient();
  return apiClient.get(inventoryUrl(`/api/v1/products/${productId}/addon-groups`));
}

export async function createAddonGroup(
  productId: string,
  data: Record<string, unknown>,
) {
  const apiClient = new ApiClient();
  const result = await apiClient.post(
    inventoryUrl(`/api/v1/products/${productId}/addon-groups`),
    data,
  );
  revalidatePath("/products");
  return result;
}

export async function updateAddonGroup(
  productId: string,
  groupId: string,
  data: Record<string, unknown>,
) {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/products/${productId}/addon-groups/${groupId}`),
    data,
  );
  revalidatePath("/products");
}

export async function deleteAddonGroup(productId: string, groupId: string) {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/products/${productId}/addon-groups/${groupId}`),
  );
  revalidatePath("/products");
}

export async function createAddonGroupItem(
  productId: string,
  groupId: string,
  data: Record<string, unknown>,
) {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/products/${productId}/addon-groups/${groupId}/items`),
    data,
  );
  revalidatePath("/products");
}

export async function updateAddonGroupItem(
  productId: string,
  groupId: string,
  itemId: string,
  data: Record<string, unknown>,
) {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/products/${productId}/addon-groups/${groupId}/items/${itemId}`),
    data,
  );
  revalidatePath("/products");
}

export async function deleteAddonGroupItem(
  productId: string,
  groupId: string,
  itemId: string,
) {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/products/${productId}/addon-groups/${groupId}/items/${itemId}`),
  );
  revalidatePath("/products");
}

// ── Bulk Price Update ───────────────────────────────────────────────

export async function bulkPriceUpdate(
  updates: { productVariantId: string; price: number }[],
) {
  const apiClient = new ApiClient();
  return apiClient.put(inventoryUrl("/api/v1/products/bulk-price"), { updates });
}

// ── Reports (kept — these hit a different service) ──────────────────

export const productSummary = async (): Promise<any> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();
    const data = await apiClient.get(`/api/reports/${location?.id}/products/summary`);
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

// ── AI Description ──────────────────────────────────────────────────

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
    if (error.code === "FORBIDDEN" && error.message?.includes("beyond the limit")) {
      const limitMatch = error.message.match(/limit is (\d+)/);
      const wantedMatch = error.message.match(/total of (\d+)/);
      throw new Error(
        `Subscription limit exceeded. Your plan allows up to ${limitMatch?.[1] ?? "?"} products, but you attempted ${wantedMatch?.[1] ?? "too many"}.`,
      );
    }
    throw new Error(`Failed to upload CSV: ${error?.message || "Please try again."}`);
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

// ── Archive ─────────────────────────────────────────────────────────

export const archiveProduct = async (ids: string | string[]) => {
  const apiClient = new ApiClient();
  const productIds = Array.isArray(ids) ? ids : [ids];

  // Archive = set active to false for each product
  for (const id of productIds) {
    await apiClient.put(inventoryUrl(`/api/v1/products/${id}`), { active: false });
  }

  revalidatePath("/products");
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
        { key: "isArchived", operator: "EQUAL", field_type: "BOOLEAN", value: false },
      ],
      sorts: [{ key: "name", direction: "ASC" }],
      page: Math.max(page ? page - 1 : 0, 0),
      size: pageLimit ? Math.min(pageLimit, 100) : 10,
    };

    await deleteActiveBusinessCookie();
    await deleteActiveLocationCookie();

    const data = await apiClient.post(`/api/menu/${locationId}`, query, {
      headers: {
        "SETTLO-API-KEY": "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a",
      },
    });
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const locationMenuDetails = async (locationId?: string): Promise<LocationDetails> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<LocationDetails>(`/api/menu/${locationId}`, {
      headers: {
        "SETTLO-API-KEY": "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a",
      },
    });
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
