"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import {
  SUPPLIER_STATUS_LABELS,
  supplierFormSchema,
  type AdminSettloSupplier,
  type SettloSupplierVerificationStatus,
  type SupplierFormInput,
} from "@/types/admin/settlo-suppliers";

/**
 * Admin (internal-ops) Settlo Supplier directory — calls the Inventory
 * Service's `settlo-suppliers` admin API with the internal staff token.
 * Authorization is the Inventory Service's server-side check on
 * `internal:accounts:read` / `internal:accounts:manage`, satisfied by the
 * caller's `internalPermissions` claim — see lib/admin/permissions.ts.
 */
function suppliersClient() {
  return new ApiClient("inventory", "staff");
}

const SUPPLIERS_PATH = "/api/v1/settlo-suppliers";

const strOrUndefined = (s: string | undefined): string | undefined => {
  const t = s?.trim();
  return t && t.length ? t : undefined;
};

/** Fields shared by the create + update payloads. */
function sharedSupplierFields(v: SupplierFormInput) {
  return {
    name: v.name,
    contactPerson: strOrUndefined(v.contactPerson),
    phone: strOrUndefined(v.phone),
    email: strOrUndefined(v.email),
    address: strOrUndefined(v.address),
    city: strOrUndefined(v.city),
    country: strOrUndefined(v.country),
    registrationNumber: strOrUndefined(v.registrationNumber),
    tinNumber: strOrUndefined(v.tinNumber),
  };
}

/** Directory listing, optionally filtered by verification status. Requires `internal:accounts:read`. */
export async function listSettloSuppliers(
  status?: SettloSupplierVerificationStatus,
): Promise<AdminSettloSupplier[]> {
  const params = new URLSearchParams();
  if (status) params.set("verificationStatus", status);
  const qs = params.toString();
  const data = await suppliersClient().get<AdminSettloSupplier[]>(
    qs ? `${SUPPLIERS_PATH}?${qs}` : SUPPLIERS_PATH,
  );
  return parseStringify(data);
}

/** A single supplier, or `null` if it doesn't exist. Requires `internal:accounts:read`. */
export async function getSettloSupplier(
  id: string,
): Promise<AdminSettloSupplier | null> {
  try {
    const data = await suppliersClient().get<AdminSettloSupplier>(
      `${SUPPLIERS_PATH}/${id}`,
    );
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/** Create a supplier. Requires `internal:accounts:manage`. */
export async function createSettloSupplier(
  input: SupplierFormInput,
): Promise<FormResponse<AdminSettloSupplier>> {
  const parsed = supplierFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid supplier details.",
    };
  }
  const body = sharedSupplierFields(parsed.data);
  try {
    const result = await suppliersClient().post<
      AdminSettloSupplier,
      typeof body
    >(SUPPLIERS_PATH, body);
    revalidatePath("/admin/settlo-suppliers");
    return parseStringify({
      responseType: "success",
      message: "Supplier created",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Update a supplier's details. Requires `internal:accounts:manage`. */
export async function updateSettloSupplier(
  id: string,
  input: SupplierFormInput,
): Promise<FormResponse<AdminSettloSupplier>> {
  const parsed = supplierFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid supplier details.",
    };
  }
  const body = sharedSupplierFields(parsed.data);
  try {
    const result = await suppliersClient().put<
      AdminSettloSupplier,
      typeof body
    >(`${SUPPLIERS_PATH}/${id}`, body);
    revalidatePath("/admin/settlo-suppliers");
    return parseStringify({
      responseType: "success",
      message: "Supplier updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update supplier",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Approve/decline/suspend a supplier. Requires `internal:accounts:manage`. */
export async function setSupplierVerificationStatus(
  id: string,
  status: SettloSupplierVerificationStatus,
): Promise<FormResponse<AdminSettloSupplier>> {
  try {
    const result = await suppliersClient().put<
      AdminSettloSupplier,
      { status: SettloSupplierVerificationStatus }
    >(`${SUPPLIERS_PATH}/${id}/verification-status`, { status });
    revalidatePath("/admin/settlo-suppliers");
    return parseStringify({
      responseType: "success",
      message: `Supplier marked as "${SUPPLIER_STATUS_LABELS[status]}"`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update verification status",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
