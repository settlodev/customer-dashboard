"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import {
  CollectionPrice,
  ProductCollection,
} from "@/types/product-collection/type";
import {
  CollectionPriceSchema,
  ProductCollectionSchema,
} from "@/types/product-collection/schema";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";

export async function searchProductCollections(
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<ProductCollection>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (q) params.set("name", q);
    params.set("page", String(page ? page - 1 : 0));
    params.set("size", String(pageLimit || 10));
    params.set("sortBy", "createdAt");
    params.set("sortDirection", "DESC");

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/product-collections?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function getProductCollection(id: string): Promise<ProductCollection> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`/api/v1/product-collections/${id}`));
  return parseStringify(data);
}

export async function createProductCollection(
  collection: z.infer<typeof ProductCollectionSchema>,
): Promise<FormResponse | void> {
  const validated = ProductCollectionSchema.safeParse(collection);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/product-collections"), {
      locationType: (await getCurrentDestination())?.type ?? "LOCATION",
      name: validated.data.name,
      description: validated.data.description,
      imageUrl: validated.data.imageUrl,
      nativeCurrency: validated.data.nativeCurrency,
      // Backend treats null/undefined as "use default sum", so only send a
      // value when the merchant explicitly entered one.
      customPrice: validated.data.customPrice ?? undefined,
      items: validated.data.items,
      currencyOverrides: validated.data.currencyOverrides,
    });

    revalidatePath("/product-collections");
    return parseStringify({
      responseType: "success",
      message: "Bundle created successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create bundle",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Apply the form's full bundle state to the backend. The PUT endpoint
 * only mutates display fields + active + native currency + custom
 * price; bundle composition and currency overrides are managed via
 * dedicated endpoints, so we diff items here and replace overrides
 * wholesale (server semantics).
 */
export async function updateProductCollection(
  id: string,
  collection: z.infer<typeof ProductCollectionSchema>,
): Promise<FormResponse | void> {
  const validated = ProductCollectionSchema.safeParse(collection);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();

    // 1) Metadata + native currency. customPrice on the PUT cannot clear
    //    an existing override (PATCH-style null is ambiguous); use the
    //    dedicated bundle-price endpoint for that — see step 3.
    await apiClient.put(inventoryUrl(`/api/v1/product-collections/${id}`), {
      name: validated.data.name,
      description: validated.data.description,
      imageUrl: validated.data.imageUrl,
      active: validated.data.active,
      nativeCurrency: validated.data.nativeCurrency,
      customPrice: validated.data.customPrice ?? undefined,
    });

    // 2) Sync bundle items against the live state: add new variants,
    //    remove dropped ones, and patch quantity for variants whose
    //    quantity changed.
    const current = await getProductCollection(id);
    const currentByVariant = new Map(
      current.items.map((item) => [item.variantId, item]),
    );
    const desiredByVariant = new Map(
      validated.data.items.map((item) => [item.variantId, item]),
    );

    const toAdd = validated.data.items.filter(
      (item) => !currentByVariant.has(item.variantId),
    );
    const toRemove = current.items
      .map((item) => item.variantId)
      .filter((variantId) => !desiredByVariant.has(variantId));
    const toUpdate = validated.data.items.filter((item) => {
      const existing = currentByVariant.get(item.variantId);
      return existing != null && Number(existing.quantity) !== Number(item.quantity);
    });

    await Promise.all([
      ...toAdd.map((item) =>
        addVariantToCollection(id, item.variantId, item.quantity),
      ),
      ...toRemove.map((variantId) => removeVariantFromCollection(id, variantId)),
      ...toUpdate.map((item) =>
        updateCollectionItemQuantity(id, item.variantId, item.quantity),
      ),
    ]);

    // 3) Allow merchants to clear the override by passing `customPrice =
    //    null` in the form. The PUT above can't express "clear" so we
    //    route through the dedicated endpoint when it transitioned from
    //    set → unset.
    if (current.customPrice != null && validated.data.customPrice == null) {
      await setCollectionBundlePrice(id, null);
    }

    // 4) Replace currency overrides wholesale (server clears + re-inserts).
    //    Skip when the form omitted the field entirely so we don't wipe
    //    overrides set out-of-band.
    if (validated.data.currencyOverrides !== undefined) {
      await setCollectionCurrencyOverrides(id, validated.data.currencyOverrides);
    }

    revalidatePath("/product-collections");
    return parseStringify({
      responseType: "success",
      message: "Bundle updated successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update bundle",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteProductCollection(id: string): Promise<void> {
  if (!id) throw new Error("Collection ID is required");
  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/product-collections/${id}`));
  revalidatePath("/product-collections");
}

export async function archiveProductCollection(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/product-collections/${id}/archive`), {});
    revalidatePath("/product-collections");
    return { responseType: "success", message: "Bundle archived" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to archive bundle",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function unarchiveProductCollection(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/product-collections/${id}/unarchive`), {});
    revalidatePath("/product-collections");
    return { responseType: "success", message: "Bundle restored" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to restore bundle",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function addVariantToCollection(
  collectionId: string,
  variantId: string,
  quantity: number,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/product-collections/${collectionId}/items`),
    { variantId, quantity },
  );
  revalidatePath("/product-collections");
}

export async function updateCollectionItemQuantity(
  collectionId: string,
  variantId: string,
  quantity: number,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(
      `/api/v1/product-collections/${collectionId}/items/${variantId}`,
    ),
    { quantity },
  );
  revalidatePath("/product-collections");
}

export async function removeVariantFromCollection(
  collectionId: string,
  variantId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(
      `/api/v1/product-collections/${collectionId}/items/${variantId}`,
    ),
  );
  revalidatePath("/product-collections");
}

export async function reorderCollectionItems(
  collectionId: string,
  variantIds: string[],
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/product-collections/${collectionId}/reorder`),
    variantIds,
  );
  revalidatePath("/product-collections");
}

/**
 * Set or clear the bundle price override. Pass `null` to revert to the
 * default-sum behaviour.
 */
export async function setCollectionBundlePrice(
  collectionId: string,
  customPrice: number | null,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/product-collections/${collectionId}/bundle-price`),
    { customPrice },
  );
  revalidatePath("/product-collections");
}

/**
 * Replace the bundle's per-currency price overrides. Send an empty
 * list to clear all overrides.
 */
export async function setCollectionCurrencyOverrides(
  collectionId: string,
  overrides: z.infer<typeof CollectionPriceSchema>[],
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(
      `/api/v1/product-collections/${collectionId}/currency-overrides`,
    ),
    overrides,
  );
  revalidatePath("/product-collections");
}

/** Convenience re-export so call-sites don't have to know the schema name. */
export type ProductCollectionCurrencyOverride = CollectionPrice;
