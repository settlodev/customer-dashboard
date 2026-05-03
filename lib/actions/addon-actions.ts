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
          isDefault: i.isDefault,
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

// Bulk save: create-or-update a group AND its items in a single call
// from the form. Stub for now — composes the existing primitives (group
// POST/PUT, plus per-item create / update / delete on edit). Replace
// the body with a single backend endpoint once /api/v1/addon-groups/{id}:bulk
// lands.
export async function saveAddonGroupWithItems(
  groupId: string | null,
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

  // Create path — the existing POST already accepts items[] inline,
  // so one network round-trip is enough.
  if (!groupId) {
    return createAddonGroup(valid.data);
  }

  // Edit path — group PUT ignores items, so we fan out per-item calls.
  // Diff the incoming list against what the server currently has:
  //   - item with no id              → POST
  //   - item whose id exists today   → PUT
  //   - existing id missing from input → DELETE
  try {
    const groupUpdate = await updateAddonGroup(groupId, valid.data);
    if ("responseType" in groupUpdate && groupUpdate.responseType === "error") {
      return groupUpdate;
    }

    const existing = await getAddonGroup(groupId);
    const existingIds = new Set((existing?.items ?? []).map((i) => i.id));
    const keptIds = new Set(
      valid.data.items
        .map((i) => i.id)
        .filter((id): id is string => !!id),
    );

    // Roll-forward: collect failures rather than aborting the run.
    const errors: string[] = [];
    let saved = 0;
    const total = valid.data.items.length;

    for (const [index, it] of valid.data.items.entries()) {
      const payload = { ...it, sortOrder: it.sortOrder ?? index };
      try {
        const r =
          it.id && existingIds.has(it.id)
            ? await updateAddonGroupItem(groupId, it.id, payload)
            : await createAddonGroupItem(groupId, payload);
        if ("responseType" in r && r.responseType === "error") {
          errors.push(`Item ${index + 1}: ${r.message}`);
        } else {
          saved++;
        }
      } catch (e: any) {
        errors.push(`Item ${index + 1}: ${e?.message ?? String(e)}`);
      }
    }

    for (const id of existingIds) {
      if (!keptIds.has(id)) {
        try {
          await deleteAddonGroupItem(groupId, id);
        } catch (e: any) {
          errors.push(`Removing item ${id}: ${e?.message ?? String(e)}`);
        }
      }
    }

    revalidatePath(`/addon-groups`);
    revalidatePath(`/addon-groups/${groupId}`);

    if (errors.length > 0) {
      return parseStringify({
        responseType: "error",
        message:
          errors.length === total
            ? `No items could be saved (${errors.length} error${errors.length === 1 ? "" : "s"}): ${errors[0]}`
            : `Saved ${saved} of ${total} item${total === 1 ? "" : "s"}; ${errors.length} failed. ${errors[0]}`,
        error: new Error(errors.join("\n")),
      });
    }

    const fresh = await getAddonGroup(groupId);
    return parseStringify(fresh ?? (groupUpdate as AddonGroup));
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to save addon group",
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
        isDefault: valid.data.isDefault,
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
        isDefault: valid.data.isDefault,
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
