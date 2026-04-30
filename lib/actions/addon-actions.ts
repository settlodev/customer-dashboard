"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { inventoryUrl } from "./inventory-client";
import type { AddonGroup, AddonGroupItem } from "@/types/product/type";
import {
  AddonGroupSchema,
  AddonGroupItemSchema,
  type AddonGroupInput,
  type AddonGroupItemInput,
} from "@/types/product/schema";

// Addon groups are business-scoped library entities. They live at
// /api/v1/addon-groups and get attached to products via
// /api/v1/products/{id}/addon-groups/{groupId}. Auth headers
// (X-Business-Id, X-Location-Id) are injected by ApiClient.

// ── Library: list / get ─────────────────────────────────────────────

export async function listAddonGroups(): Promise<AddonGroup[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/addon-groups`));
    return parseStringify(data);
  } catch {
    return [];
  }
}

export async function getAddonGroup(
  groupId: string,
): Promise<AddonGroup | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/addon-groups/${groupId}`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

// ── Library: create / update / delete / archive ─────────────────────

export async function createAddonGroup(
  input: AddonGroupInput,
): Promise<AddonGroup | FormResponse> {
  const valid = AddonGroupSchema.safeParse(input);
  if (!valid.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(valid.error.message),
    });
  }
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(
      inventoryUrl(`/api/v1/addon-groups`),
      {
        name: valid.data.name,
        minSelections: valid.data.minSelections,
        maxSelections: valid.data.maxSelections,
        sortOrder: valid.data.sortOrder,
        active: valid.data.active,
        items: valid.data.items.map((i) => ({
          productVariantId: i.productVariantId,
          priceOverride: i.priceOverride ?? undefined,
          sortOrder: i.sortOrder,
          active: i.active,
        })),
      },
    )) as AddonGroup;
    revalidatePath(`/addon-groups`);
    return parseStringify(created);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create addon group",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateAddonGroup(
  groupId: string,
  input: AddonGroupInput,
): Promise<AddonGroup | FormResponse> {
  const valid = AddonGroupSchema.safeParse(input);
  if (!valid.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(valid.error.message),
    });
  }
  try {
    const apiClient = new ApiClient();
    const updated = (await apiClient.put(
      inventoryUrl(`/api/v1/addon-groups/${groupId}`),
      {
        name: valid.data.name,
        minSelections: valid.data.minSelections,
        maxSelections: valid.data.maxSelections,
        sortOrder: valid.data.sortOrder,
        active: valid.data.active,
      },
    )) as AddonGroup;
    revalidatePath(`/addon-groups`);
    return parseStringify(updated);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update addon group",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteAddonGroup(groupId: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/addon-groups/${groupId}`));
  revalidatePath(`/addon-groups`);
}

export async function archiveAddonGroup(groupId: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/addon-groups/${groupId}/archive`),
    {},
  );
  revalidatePath(`/addon-groups`);
}

export async function unarchiveAddonGroup(groupId: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/addon-groups/${groupId}/unarchive`),
    {},
  );
  revalidatePath(`/addon-groups`);
}

// ── Addon items (library, no productId) ─────────────────────────────

export async function createAddonGroupItem(
  groupId: string,
  input: AddonGroupItemInput,
): Promise<AddonGroupItem | FormResponse> {
  const valid = AddonGroupItemSchema.safeParse(input);
  if (!valid.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(valid.error.message),
    });
  }
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(
      inventoryUrl(`/api/v1/addon-groups/${groupId}/items`),
      {
        productVariantId: valid.data.productVariantId,
        priceOverride: valid.data.priceOverride ?? undefined,
        sortOrder: valid.data.sortOrder,
        active: valid.data.active,
      },
    )) as AddonGroupItem;
    revalidatePath(`/addon-groups`);
    return parseStringify(created);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to add addon item",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateAddonGroupItem(
  groupId: string,
  itemId: string,
  input: AddonGroupItemInput,
): Promise<AddonGroupItem | FormResponse> {
  const valid = AddonGroupItemSchema.safeParse(input);
  if (!valid.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(valid.error.message),
    });
  }
  try {
    const apiClient = new ApiClient();
    const updated = (await apiClient.put(
      inventoryUrl(`/api/v1/addon-groups/${groupId}/items/${itemId}`),
      {
        productVariantId: valid.data.productVariantId,
        priceOverride: valid.data.priceOverride ?? undefined,
        sortOrder: valid.data.sortOrder,
        active: valid.data.active,
      },
    )) as AddonGroupItem;
    revalidatePath(`/addon-groups`);
    return parseStringify(updated);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update addon item",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteAddonGroupItem(
  groupId: string,
  itemId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/addon-groups/${groupId}/items/${itemId}`),
  );
  revalidatePath(`/addon-groups`);
}

// ── Per-product: list attached / attach / detach / reorder ──────────

export async function listProductAddonGroups(
  productId: string,
): Promise<AddonGroup[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/products/${productId}/addon-groups`),
    );
    return parseStringify(data);
  } catch {
    return [];
  }
}

export async function attachAddonGroup(
  productId: string,
  groupId: string,
  sortOrder?: number,
): Promise<AddonGroup | FormResponse> {
  try {
    const apiClient = new ApiClient();
    const attached = (await apiClient.post(
      inventoryUrl(`/api/v1/products/${productId}/addon-groups/${groupId}`),
      sortOrder != null ? { sortOrder } : {},
    )) as AddonGroup;
    revalidatePath(`/products/${productId}/edit`);
    return parseStringify(attached);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to attach addon group",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateAttachedAddonGroup(
  productId: string,
  groupId: string,
  sortOrder: number,
): Promise<AddonGroup | FormResponse> {
  try {
    const apiClient = new ApiClient();
    const updated = (await apiClient.put(
      inventoryUrl(`/api/v1/products/${productId}/addon-groups/${groupId}`),
      { sortOrder },
    )) as AddonGroup;
    revalidatePath(`/products/${productId}/edit`);
    return parseStringify(updated);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update attachment",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function detachAddonGroup(
  productId: string,
  groupId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/products/${productId}/addon-groups/${groupId}`),
  );
  revalidatePath(`/products/${productId}/edit`);
}
