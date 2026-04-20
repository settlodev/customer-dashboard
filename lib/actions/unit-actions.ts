"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { FormResponse } from "@/types/types";
import type {
  ConvertResult,
  UnitConversion,
  UnitConversionPayload,
  UnitOfMeasure,
  UnitOfMeasurePayload,
} from "@/types/unit/type";
import {
  UnitConversionSchema,
  UnitOfMeasureSchema,
} from "@/types/unit/type";
import { inventoryUrl } from "./inventory-client";

// ── Reads ───────────────────────────────────────────────────────────

export async function getUnits(): Promise<UnitOfMeasure[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/units-of-measure"));
    return (parseStringify(data) ?? []) as UnitOfMeasure[];
  } catch {
    return [];
  }
}

export async function getUnit(id: string): Promise<UnitOfMeasure | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/units-of-measure/${id}`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function getConversionsForUnit(
  unitId: string,
): Promise<UnitConversion[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/units-of-measure/${unitId}/conversions`),
    );
    return (parseStringify(data) ?? []) as UnitConversion[];
  } catch {
    return [];
  }
}

export async function getAllConversions(): Promise<UnitConversion[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl("/api/v1/units-of-measure/conversions"),
    );
    return (parseStringify(data) ?? []) as UnitConversion[];
  } catch {
    return [];
  }
}

// Kept for stock_form + other callers — signature unchanged.
export async function convertUnits(
  fromUnitId: string,
  toUnitId: string,
  quantity: number,
): Promise<ConvertResult | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl("/api/v1/units-of-measure/convert"),
      { fromUnitId, toUnitId, quantity },
    );
    return parseStringify(data) as ConvertResult;
  } catch {
    return null;
  }
}

// ── UoM mutations ───────────────────────────────────────────────────

export async function createUnit(
  payload: UnitOfMeasurePayload,
): Promise<FormResponse<UnitOfMeasure>> {
  const validated = UnitOfMeasureSchema.safeParse(payload);
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
      inventoryUrl("/api/v1/units-of-measure"),
      validated.data,
    );
    revalidatePath("/units");
    return {
      responseType: "success",
      message: "Unit created",
      data: parseStringify(data) as UnitOfMeasure,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't create unit",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function updateUnit(
  id: string,
  payload: UnitOfMeasurePayload,
): Promise<FormResponse<UnitOfMeasure>> {
  const validated = UnitOfMeasureSchema.safeParse(payload);
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
      inventoryUrl(`/api/v1/units-of-measure/${id}`),
      validated.data,
    );
    revalidatePath("/units");
    revalidatePath(`/units/${id}`);
    return {
      responseType: "success",
      message: "Unit updated",
      data: parseStringify(data) as UnitOfMeasure,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't update unit",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function archiveUnit(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      inventoryUrl(`/api/v1/units-of-measure/${id}/archive`),
      {},
    );
    revalidatePath("/units");
    revalidatePath(`/units/${id}`);
    return { responseType: "success", message: "Unit archived" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't archive unit",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function unarchiveUnit(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      inventoryUrl(`/api/v1/units-of-measure/${id}/unarchive`),
      {},
    );
    revalidatePath("/units");
    revalidatePath(`/units/${id}`);
    return { responseType: "success", message: "Unit restored" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't restore unit",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteUnit(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(inventoryUrl(`/api/v1/units-of-measure/${id}`));
    revalidatePath("/units");
    return { responseType: "success", message: "Unit deleted" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't delete unit",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ── Conversion mutations ────────────────────────────────────────────

export async function createConversion(
  payload: UnitConversionPayload,
): Promise<FormResponse<UnitConversion>> {
  const validated = UnitConversionSchema.safeParse(payload);
  if (!validated.success) {
    return {
      responseType: "error",
      message: validated.error.issues[0]?.message ?? "Check the form",
      error: new Error(validated.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl("/api/v1/units-of-measure/conversions"),
      {
        fromUnitId: validated.data.fromUnitId,
        toUnitId: validated.data.toUnitId,
        multiplier: Number(validated.data.multiplier),
      },
    );
    revalidatePath("/units");
    revalidatePath(`/units/${validated.data.fromUnitId}`);
    return {
      responseType: "success",
      message: "Conversion added",
      data: parseStringify(data) as UnitConversion,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't add conversion",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function updateConversion(
  id: string,
  multiplier: number,
  unitId?: string,
): Promise<FormResponse<UnitConversion>> {
  if (!multiplier || Number.isNaN(multiplier) || multiplier <= 0) {
    return {
      responseType: "error",
      message: "Multiplier must be a positive number",
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.put(
      inventoryUrl(`/api/v1/units-of-measure/conversions/${id}`),
      { multiplier },
    );
    revalidatePath("/units");
    if (unitId) revalidatePath(`/units/${unitId}`);
    return {
      responseType: "success",
      message: "Conversion updated",
      data: parseStringify(data) as UnitConversion,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't update conversion",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteConversion(
  id: string,
  unitId?: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      inventoryUrl(`/api/v1/units-of-measure/conversions/${id}`),
    );
    revalidatePath("/units");
    if (unitId) revalidatePath(`/units/${unitId}`);
    return { responseType: "success", message: "Conversion removed" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't remove conversion",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
