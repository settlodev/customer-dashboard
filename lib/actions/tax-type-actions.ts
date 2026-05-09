"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type { TaxType } from "@/types/tax-type/type";
import { TaxTypeSchema } from "@/types/tax-type/schema";

import { accountingUrl } from "./accounting-client";

/**
 * Fetch the business's tax types from the Accounting Service. The
 * accounting endpoint returns a plain List<TaxTypeResponse> (no
 * pagination wrapper), so callers get the raw array. The product
 * variant form uses these to populate its per-variant tax-type picker
 * and to resolve the default rate (code "A" / Standard Rate).
 */
export async function fetchAllTaxTypes(): Promise<TaxType[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(accountingUrl("/api/v1/tax-types"));
    return (parseStringify(data) as TaxType[]) ?? [];
  } catch {
    return [];
  }
}

export async function getTaxType(id: string): Promise<TaxType | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(accountingUrl(`/api/v1/tax-types/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createTaxType(
  values: z.infer<typeof TaxTypeSchema>,
): Promise<FormResponse<TaxType>> {
  const parsed = TaxTypeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl("/api/v1/tax-types"),
      parsed.data,
    )) as TaxType;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Tax type created",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to create tax type");
  }
}

export async function updateTaxType(
  id: string,
  values: z.infer<typeof TaxTypeSchema>,
): Promise<FormResponse<TaxType>> {
  const parsed = TaxTypeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(
      accountingUrl(`/api/v1/tax-types/${id}`),
      parsed.data,
    )) as TaxType;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Tax type updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to update tax type");
  }
}

export async function setDefaultTaxType(
  id: string,
): Promise<FormResponse<TaxType>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(
      accountingUrl(`/api/v1/tax-types/${id}/set-default`),
      {},
    )) as TaxType;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Default tax updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to set default");
  }
}

export async function deleteTaxType(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(accountingUrl(`/api/v1/tax-types/${id}`));
    revalidatePath("/settings");
    return { responseType: "success", message: "Tax type deleted" };
  } catch (error: unknown) {
    return errResp(error, "Failed to delete tax type");
  }
}

function errResp(error: unknown, fallback: string): FormResponse<TaxType> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
