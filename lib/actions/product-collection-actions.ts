"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { ProductCollection } from "@/types/product-collection/type";
import { ProductCollectionSchema } from "@/types/product-collection/schema";
import { inventoryUrl } from "./inventory-client";

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
      locationType: "LOCATION",
      name: validated.data.name,
      description: validated.data.description,
      imageUrl: validated.data.imageUrl,
      productIds: validated.data.productIds,
    });

    revalidatePath("/product-collections");
    return parseStringify({
      responseType: "success",
      message: "Collection created successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create collection",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

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

    // Update basic fields (the PUT endpoint doesn't accept productIds)
    await apiClient.put(inventoryUrl(`/api/v1/product-collections/${id}`), {
      name: validated.data.name,
      description: validated.data.description,
      imageUrl: validated.data.imageUrl,
      active: validated.data.active,
    });

    // Sync products: get current state, compute diff, add/remove
    const current = await getProductCollection(id);
    const currentProductIds = new Set(current.products.map((p) => p.productId));
    const desiredProductIds = new Set(validated.data.productIds);

    const toAdd = validated.data.productIds.filter((pid) => !currentProductIds.has(pid));
    const toRemove = current.products
      .map((p) => p.productId)
      .filter((pid) => !desiredProductIds.has(pid));

    await Promise.all([
      ...toAdd.map((pid) => addProductToCollection(id, pid)),
      ...toRemove.map((pid) => removeProductFromCollection(id, pid)),
    ]);

    revalidatePath("/product-collections");
    return parseStringify({
      responseType: "success",
      message: "Collection updated successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update collection",
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
    return { responseType: "success", message: "Collection archived" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to archive collection",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function unarchiveProductCollection(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/product-collections/${id}/unarchive`), {});
    revalidatePath("/product-collections");
    return { responseType: "success", message: "Collection restored" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to restore collection",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function addProductToCollection(
  collectionId: string,
  productId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/product-collections/${collectionId}/products/${productId}`),
    {},
  );
  revalidatePath("/product-collections");
}

export async function removeProductFromCollection(
  collectionId: string,
  productId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/product-collections/${collectionId}/products/${productId}`),
  );
  revalidatePath("/product-collections");
}

export async function reorderCollectionProducts(
  collectionId: string,
  productIds: string[],
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(
    inventoryUrl(`/api/v1/product-collections/${collectionId}/reorder`),
    productIds,
  );
  revalidatePath("/product-collections");
}
