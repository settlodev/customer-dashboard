"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
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

// Wire payload for tracking — always sends sellabilityMode so the
// backend can map to the (unlimited, stockLinkType) pair authoritatively.
// stockVariantId / directQuantity are only meaningful in DIRECT mode
// and are cleared otherwise so a stale link can't sneak through a mode
// flip.
function stockFieldsFor(input: ModifierOptionInput) {
  if (input.sellabilityMode === "DIRECT") {
    return {
      sellabilityMode: "DIRECT" as const,
      stockVariantId: input.stockVariantId || undefined,
      directQuantity: input.directQuantity ?? undefined,
    };
  }
  return {
    sellabilityMode: input.sellabilityMode,
    stockVariantId: undefined,
    directQuantity: undefined,
  };
}

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
  } catch (error) {
    rethrowIfBoundary(error);
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
          ...stockFieldsFor(o),
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

// Bulk save: create-or-update a group AND its options in a single call from
// the form. Stub for now — composes the existing primitives (group POST/PUT
// which already accepts an `options[]` on create, plus per-option create /
// update / delete on edit). Replace the body with a single backend endpoint
// once /api/v1/modifier-groups/{id}:bulk lands.
export async function saveModifierGroupWithOptions(
  groupId: string | null,
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

  // Create path — the existing POST already accepts options[] inline, so
  // one network round-trip is enough.
  if (!groupId) {
    return createModifierGroup(valid.data);
  }

  // Edit path — group PUT ignores options, so we fan out per-option calls.
  // Diff the incoming list against what the server currently has:
  //   - option with no id              → POST
  //   - option whose id exists today   → PUT
  //   - existing id missing from input → DELETE
  try {
    const groupUpdate = await updateModifierGroup(groupId, valid.data);
    if ("responseType" in groupUpdate && groupUpdate.responseType === "error") {
      return groupUpdate;
    }

    const existing = await getModifierGroup(groupId);
    const existingIds = new Set((existing?.options ?? []).map((o) => o.id));
    const keptIds = new Set(
      valid.data.options
        .map((o) => o.id)
        .filter((id): id is string => !!id),
    );

    // Roll-forward: collect failures instead of bailing on the first
    // one. With a backend `:bulk` endpoint we'd commit atomically; until
    // then partial success is far better UX than "saved 0, blocked on
    // option 3, lost everything else."
    const errors: string[] = [];
    let saved = 0;
    const total = valid.data.options.length;

    for (const [index, opt] of valid.data.options.entries()) {
      const payload = { ...opt, sortOrder: opt.sortOrder ?? index };
      try {
        const r =
          opt.id && existingIds.has(opt.id)
            ? await updateModifierOption(groupId, opt.id, payload)
            : await createModifierOption(groupId, payload);
        if ("responseType" in r && r.responseType === "error") {
          errors.push(`Option ${index + 1} (${opt.name}): ${r.message}`);
        } else {
          saved++;
        }
      } catch (e: any) {
        errors.push(`Option ${index + 1} (${opt.name}): ${e?.message ?? String(e)}`);
      }
    }

    for (const id of existingIds) {
      if (!keptIds.has(id)) {
        try {
          await deleteModifierOption(groupId, id);
        } catch (e: any) {
          errors.push(`Removing option ${id}: ${e?.message ?? String(e)}`);
        }
      }
    }

    revalidatePath(`/modifier-groups`);
    revalidatePath(`/modifier-groups/${groupId}`);

    if (errors.length > 0) {
      return parseStringify({
        responseType: "error",
        message:
          errors.length === total
            ? `No options could be saved (${errors.length} error${errors.length === 1 ? "" : "s"}): ${errors[0]}`
            : `Saved ${saved} of ${total} option${total === 1 ? "" : "s"}; ${errors.length} failed. ${errors[0]}`,
        error: new Error(errors.join("\n")),
      });
    }

    const fresh = await getModifierGroup(groupId);
    return parseStringify(fresh ?? (groupUpdate as ModifierGroup));
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to save modifier group",
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
        ...stockFieldsFor(valid.data),
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
        ...stockFieldsFor(valid.data),
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
