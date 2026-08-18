"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { FormResponse } from "@/types/types";
import {
  SupplierSourceListSchema,
  type SupplierSourceList,
  type SupplierSourceListPayload,
} from "@/types/supplier-source-list/type";
import { inventoryUrl } from "./inventory-client";

function normalise(values: SupplierSourceListPayload) {
  return {
    ...values,
    validFrom: values.validFrom || null,
    validTo: values.validTo || null,
    notes: values.notes || null,
  };
}

// ── Reads ───────────────────────────────────────────────────────────

export async function fetchSourceListForSupplier(
  supplierId: string,
): Promise<SupplierSourceList[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/supplier-source-list/supplier/${supplierId}`),
    );
    return (parseStringify(data) ?? []) as SupplierSourceList[];
  } catch {
    return [];
  }
}

export async function fetchSourceListForVariant(
  stockVariantId: string,
): Promise<SupplierSourceList[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/supplier-source-list/variant/${stockVariantId}`),
    );
    return (parseStringify(data) ?? []) as SupplierSourceList[];
  } catch {
    return [];
  }
}

export async function fetchPreferredSupplierForVariant(
  stockVariantId: string,
): Promise<SupplierSourceList | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/supplier-source-list/variant/${stockVariantId}/preferred`,
      ),
    );
    return parseStringify(data) as SupplierSourceList;
  } catch {
    return null;
  }
}

// ── Mutations ───────────────────────────────────────────────────────

export async function createSourceList(
  payload: SupplierSourceListPayload,
): Promise<FormResponse> {
  const validated = SupplierSourceListSchema.safeParse(payload);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl("/api/v1/supplier-source-list"),
      normalise(validated.data),
    );
    revalidatePath(`/suppliers/${validated.data.supplierId}`);
    return {
      responseType: "success",
      message: "Variant added to source list",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't update source list",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function updateSourceList(
  id: string,
  payload: SupplierSourceListPayload,
): Promise<FormResponse> {
  const validated = SupplierSourceListSchema.safeParse(payload);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.put(
      inventoryUrl(`/api/v1/supplier-source-list/${id}`),
      normalise(validated.data),
    );
    revalidatePath(`/suppliers/${validated.data.supplierId}`);
    return {
      responseType: "success",
      message: "Source list updated",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't update source list",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteSourceList(
  id: string,
  supplierId?: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(inventoryUrl(`/api/v1/supplier-source-list/${id}`));
    if (supplierId) revalidatePath(`/suppliers/${supplierId}`);
    return { responseType: "success", message: "Source list entry removed" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't remove source list entry",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
