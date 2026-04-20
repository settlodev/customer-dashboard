"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { FormResponse } from "@/types/types";
import type { Supplier } from "@/types/supplier/type";
import { SupplierSchema } from "@/types/supplier/schema";
import { inventoryUrl } from "./inventory-client";

// ── Reads ───────────────────────────────────────────────────────────

export async function fetchAllSuppliers(): Promise<Supplier[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/suppliers"));
    const list = (parseStringify(data) ?? []) as Supplier[];
    return list;
  } catch {
    return [];
  }
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/suppliers/${id}`));
    return parseStringify(data) as Supplier;
  } catch {
    return null;
  }
}

// ── Mutations ───────────────────────────────────────────────────────

type SupplierPayload = z.infer<typeof SupplierSchema>;

function normalise(values: SupplierPayload) {
  return {
    ...values,
    phone: values.phone || null,
    email: values.email || null,
    address: values.address || null,
    registrationNumber: values.registrationNumber || null,
    tinNumber: values.tinNumber || null,
    settloSupplierId: values.settloSupplierId || null,
  };
}

export async function createSupplier(
  supplier: SupplierPayload,
): Promise<FormResponse> {
  const validated = SupplierSchema.safeParse(supplier);
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
      inventoryUrl("/api/v1/suppliers"),
      normalise(validated.data),
    );
    const saved = parseStringify(data) as Supplier;
    revalidatePath("/suppliers");
    return {
      responseType: "success",
      message: "Supplier created",
      data: saved,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't create supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function updateSupplier(
  id: string,
  supplier: SupplierPayload,
): Promise<FormResponse> {
  const validated = SupplierSchema.safeParse(supplier);
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
      inventoryUrl(`/api/v1/suppliers/${id}`),
      normalise(validated.data),
    );
    const saved = parseStringify(data) as Supplier;
    revalidatePath(`/suppliers/${id}`);
    revalidatePath("/suppliers");
    return {
      responseType: "success",
      message: "Supplier updated",
      data: saved,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't update supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteSupplier(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(inventoryUrl(`/api/v1/suppliers/${id}`));
    revalidatePath("/suppliers");
    return { responseType: "success", message: "Supplier deleted" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't delete supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function archiveSupplier(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/suppliers/${id}/archive`), {});
    revalidatePath(`/suppliers/${id}`);
    revalidatePath("/suppliers");
    return { responseType: "success", message: "Supplier archived" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't archive supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function unarchiveSupplier(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/suppliers/${id}/unarchive`), {});
    revalidatePath(`/suppliers/${id}`);
    revalidatePath("/suppliers");
    return { responseType: "success", message: "Supplier restored" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't restore supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function linkSettloSupplier(
  supplierId: string,
  settloSupplierId: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      inventoryUrl(`/api/v1/suppliers/${supplierId}/link`),
      { settloSupplierId },
    );
    revalidatePath(`/suppliers/${supplierId}`);
    return { responseType: "success", message: "Linked to marketplace supplier" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't link supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function unlinkSettloSupplier(
  supplierId: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      inventoryUrl(`/api/v1/suppliers/${supplierId}/unlink`),
      {},
    );
    revalidatePath(`/suppliers/${supplierId}`);
    return { responseType: "success", message: "Unlinked from marketplace" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't unlink supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
