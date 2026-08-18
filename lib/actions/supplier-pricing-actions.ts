"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { FormResponse } from "@/types/types";
import {
  SupplierPricingSchema,
  type SupplierPricing,
  type SupplierPricingPayload,
} from "@/types/supplier-pricing/type";
import { inventoryUrl } from "./inventory-client";

function normalise(values: SupplierPricingPayload) {
  return {
    ...values,
    paymentTerms: values.paymentTerms || null,
    validFrom: values.validFrom || null,
    validTo: values.validTo || null,
    notes: values.notes || null,
  };
}

// ── Reads ───────────────────────────────────────────────────────────

export async function fetchSupplierPricing(
  supplierId: string,
): Promise<SupplierPricing[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/supplier-pricing/supplier/${supplierId}`),
    );
    return (parseStringify(data) ?? []) as SupplierPricing[];
  } catch {
    return [];
  }
}

export async function fetchVariantPricing(
  stockVariantId: string,
): Promise<SupplierPricing[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/supplier-pricing/variant/${stockVariantId}`),
    );
    return (parseStringify(data) ?? []) as SupplierPricing[];
  } catch {
    return [];
  }
}

export async function fetchBestPriceForVariant(
  stockVariantId: string,
): Promise<SupplierPricing | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/supplier-pricing/variant/${stockVariantId}/best-price`,
      ),
    );
    return parseStringify(data) as SupplierPricing;
  } catch {
    return null;
  }
}

// ── Mutations ───────────────────────────────────────────────────────

export async function createSupplierPricing(
  payload: SupplierPricingPayload,
): Promise<FormResponse> {
  const validated = SupplierPricingSchema.safeParse(payload);
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
      inventoryUrl("/api/v1/supplier-pricing"),
      normalise(validated.data),
    );
    revalidatePath(`/suppliers/${validated.data.supplierId}`);
    return {
      responseType: "success",
      message: "Pricing added",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't save pricing",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function updateSupplierPricing(
  id: string,
  payload: SupplierPricingPayload,
): Promise<FormResponse> {
  const validated = SupplierPricingSchema.safeParse(payload);
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
      inventoryUrl(`/api/v1/supplier-pricing/${id}`),
      normalise(validated.data),
    );
    revalidatePath(`/suppliers/${validated.data.supplierId}`);
    return {
      responseType: "success",
      message: "Pricing updated",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't update pricing",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteSupplierPricing(
  id: string,
  supplierId?: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(inventoryUrl(`/api/v1/supplier-pricing/${id}`));
    if (supplierId) revalidatePath(`/suppliers/${supplierId}`);
    return { responseType: "success", message: "Pricing removed" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't delete pricing",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
