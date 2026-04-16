"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { Supplier, SettloSupplier } from "@/types/supplier/type";
import { SupplierSchema } from "@/types/supplier/schema";
import { inventoryUrl } from "./inventory-client";

// ---------------------------------------------------------------------------
// List (returns plain array — backend has no pagination)
// ---------------------------------------------------------------------------

export async function fetchAllSuppliers(): Promise<Supplier[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/suppliers"));
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

export async function fetchSettloSuppliers(): Promise<SettloSupplier[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl("/api/v1/supplier-catalog/suppliers"),
    );
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Get
// ---------------------------------------------------------------------------

export async function getSupplier(id: string): Promise<Supplier> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`/api/v1/suppliers/${id}`));
  return parseStringify(data);
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createSupplier(
  supplier: z.infer<typeof SupplierSchema>,
): Promise<FormResponse | void> {
  const validated = SupplierSchema.safeParse(supplier);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/suppliers"), validated.data);

    revalidatePath("/suppliers");
    return parseStringify({
      responseType: "success",
      message: "Supplier created successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateSupplier(
  id: string,
  supplier: z.infer<typeof SupplierSchema>,
): Promise<FormResponse | void> {
  const validated = SupplierSchema.safeParse(supplier);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(inventoryUrl(`/api/v1/suppliers/${id}`), validated.data);

    revalidatePath("/suppliers");
    return parseStringify({
      responseType: "success",
      message: "Supplier updated successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ---------------------------------------------------------------------------
// Delete (soft delete = archive)
// ---------------------------------------------------------------------------

export async function deleteSupplier(id: string): Promise<void> {
  if (!id) throw new Error("Supplier ID is required");
  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/suppliers/${id}`));
  revalidatePath("/suppliers");
}

// ---------------------------------------------------------------------------
// Archive / Unarchive (toggle active flag)
// ---------------------------------------------------------------------------

export async function archiveSupplier(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/suppliers/${id}/archive`), {});
    revalidatePath("/suppliers");
    return { responseType: "success", message: "Supplier archived" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to archive supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function unarchiveSupplier(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/suppliers/${id}/unarchive`), {});
    revalidatePath("/suppliers");
    return { responseType: "success", message: "Supplier restored" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to restore supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ---------------------------------------------------------------------------
// Link / Unlink Settlo supplier
// ---------------------------------------------------------------------------

export async function linkSettloSupplier(
  supplierId: string,
  settloSupplierId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/suppliers/${supplierId}/link`), {
    settloSupplierId,
  });
  revalidatePath("/suppliers");
}

export async function unlinkSettloSupplier(supplierId: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/suppliers/${supplierId}/unlink`), {});
  revalidatePath("/suppliers");
}
