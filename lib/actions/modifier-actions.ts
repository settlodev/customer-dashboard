"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { inventoryUrl } from "./inventory-client";
import type { ModifierGroup, ModifierOption } from "@/types/product/type";
import {
  ModifierGroupSchema,
  ModifierOptionSchema,
  type ModifierGroupInput,
  type ModifierOptionInput,
} from "@/types/product/schema";

// Modifier groups are business-scoped library entities. They live at
// /api/v1/modifier-groups and get attached to products via
// /api/v1/products/{id}/modifier-groups/{groupId}. Auth headers
// (X-Business-Id, X-Location-Id) are injected by ApiClient.

// ── Library: list / get ─────────────────────────────────────────────

export async function listModifierGroups(): Promise<ModifierGroup[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/modifier-groups`));
    return parseStringify(data);
  } catch {
    return [];
  }
}

export async function getModifierGroup(
  groupId: string,
): Promise<ModifierGroup | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/modifier-groups/${groupId}`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

// ── Library: create / update / delete / archive ─────────────────────

export async function createModifierGroup(
  input: ModifierGroupInput,
): Promise<ModifierGroup | FormResponse> {
  const valid = ModifierGroupSchema.safeParse(input);
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
      inventoryUrl(`/api/v1/modifier-groups`),
      {
        name: valid.data.name,
        selectionType: valid.data.selectionType,
        minSelections: valid.data.minSelections,
        maxSelections: valid.data.maxSelections,
        sortOrder: valid.data.sortOrder,
        active: valid.data.active,
        options: valid.data.options.map((o) => ({
          name: o.name,
          priceAdjustment: o.priceAdjustment,
          isDefault: o.isDefault,
          stockVariantId: o.stockVariantId || undefined,
          stockQuantity: o.stockQuantity ?? undefined,
          sortOrder: o.sortOrder,
          active: o.active,
        })),
      },
    )) as ModifierGroup;
    revalidatePath(`/modifier-groups`);
    return parseStringify(created);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create modifier group",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateModifierGroup(
  groupId: string,
  input: ModifierGroupInput,
): Promise<ModifierGroup | FormResponse> {
  const valid = ModifierGroupSchema.safeParse(input);
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
      inventoryUrl(`/api/v1/modifier-groups/${groupId}`),
      {
        name: valid.data.name,
        selectionType: valid.data.selectionType,
        minSelections: valid.data.minSelections,
        maxSelections: valid.data.maxSelections,
        sortOrder: valid.data.sortOrder,
        active: valid.data.active,
      },
    )) as ModifierGroup;
    revalidatePath(`/modifier-groups`);
    return parseStringify(updated);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update modifier group",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteModifierGroup(groupId: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/modifier-groups/${groupId}`));
  revalidatePath(`/modifier-groups`);
}

export async function archiveModifierGroup(groupId: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/modifier-groups/${groupId}/archive`),
    {},
  );
  revalidatePath(`/modifier-groups`);
}

export async function unarchiveModifierGroup(groupId: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/modifier-groups/${groupId}/unarchive`),
    {},
  );
  revalidatePath(`/modifier-groups`);
}

// ── Modifier options (library, no productId) ────────────────────────

export async function createModifierOption(
  groupId: string,
  input: ModifierOptionInput,
): Promise<ModifierOption | FormResponse> {
  const valid = ModifierOptionSchema.safeParse(input);
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
      inventoryUrl(`/api/v1/modifier-groups/${groupId}/options`),
      {
        name: valid.data.name,
        priceAdjustment: valid.data.priceAdjustment,
        isDefault: valid.data.isDefault,
        stockVariantId: valid.data.stockVariantId || undefined,
        stockQuantity: valid.data.stockQuantity ?? undefined,
        sortOrder: valid.data.sortOrder,
        active: valid.data.active,
      },
    )) as ModifierOption;
    revalidatePath(`/modifier-groups`);
    return parseStringify(created);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create option",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateModifierOption(
  groupId: string,
  optionId: string,
  input: ModifierOptionInput,
): Promise<ModifierOption | FormResponse> {
  const valid = ModifierOptionSchema.safeParse(input);
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
      inventoryUrl(`/api/v1/modifier-groups/${groupId}/options/${optionId}`),
      {
        name: valid.data.name,
        priceAdjustment: valid.data.priceAdjustment,
        isDefault: valid.data.isDefault,
        stockVariantId: valid.data.stockVariantId || undefined,
        stockQuantity: valid.data.stockQuantity ?? undefined,
        sortOrder: valid.data.sortOrder,
        active: valid.data.active,
      },
    )) as ModifierOption;
    revalidatePath(`/modifier-groups`);
    return parseStringify(updated);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update option",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteModifierOption(
  groupId: string,
  optionId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/modifier-groups/${groupId}/options/${optionId}`),
  );
  revalidatePath(`/modifier-groups`);
}

export async function archiveModifierOption(
  groupId: string,
  optionId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(
      `/api/v1/modifier-groups/${groupId}/options/${optionId}/archive`,
    ),
    {},
  );
  revalidatePath(`/modifier-groups`);
}

export async function unarchiveModifierOption(
  groupId: string,
  optionId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(
      `/api/v1/modifier-groups/${groupId}/options/${optionId}/unarchive`,
    ),
    {},
  );
  revalidatePath(`/modifier-groups`);
}

// ── Per-product: list attached / attach / detach / reorder ──────────

export async function listProductModifierGroups(
  productId: string,
): Promise<ModifierGroup[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/products/${productId}/modifier-groups`),
    );
    return parseStringify(data);
  } catch {
    return [];
  }
}

export async function attachModifierGroup(
  productId: string,
  groupId: string,
  sortOrder?: number,
): Promise<ModifierGroup | FormResponse> {
  try {
    const apiClient = new ApiClient();
    const attached = (await apiClient.post(
      inventoryUrl(`/api/v1/products/${productId}/modifier-groups/${groupId}`),
      sortOrder != null ? { sortOrder } : {},
    )) as ModifierGroup;
    revalidatePath(`/products/${productId}/edit`);
    return parseStringify(attached);
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to attach modifier group",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateAttachedModifierGroup(
  productId: string,
  groupId: string,
  sortOrder: number,
): Promise<ModifierGroup | FormResponse> {
  try {
    const apiClient = new ApiClient();
    const updated = (await apiClient.put(
      inventoryUrl(`/api/v1/products/${productId}/modifier-groups/${groupId}`),
      { sortOrder },
    )) as ModifierGroup;
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

export async function detachModifierGroup(
  productId: string,
  groupId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(
    inventoryUrl(`/api/v1/products/${productId}/modifier-groups/${groupId}`),
  );
  revalidatePath(`/products/${productId}/edit`);
}
