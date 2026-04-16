"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import type { PurchaseRequisition, Lpo, Grn, SupplierOrder } from "@/types/procurement/type";
import { inventoryUrl } from "./inventory-client";

// ── Purchase Requisitions ───────────────────────────────────────────

export async function getRequisitions(
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<PurchaseRequisition>> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(
    inventoryUrl(`/api/v1/purchase-requisitions?page=${page}&size=${size}&sortBy=createdAt&sortDirection=desc`),
  );
  return parseStringify(data);
}

export async function getRequisition(id: string): Promise<PurchaseRequisition | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/purchase-requisitions/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createRequisition(data: Record<string, unknown>): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl("/api/v1/purchase-requisitions"), {
    locationType: "LOCATION",
    ...data,
  });
  revalidatePath("/stock-purchases");
}

export async function submitRequisition(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/purchase-requisitions/${id}/submit`), {});
  revalidatePath("/stock-purchases");
}

export async function approveRequisition(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/purchase-requisitions/${id}/approve`), {});
  revalidatePath("/stock-purchases");
}

export async function rejectRequisition(id: string, reason: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/purchase-requisitions/${id}/reject`), { reason });
  revalidatePath("/stock-purchases");
}

export async function convertRequisitionToLpo(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/purchase-requisitions/${id}/convert-to-lpo`), {});
  revalidatePath("/stock-purchases");
}

export async function cancelRequisition(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/purchase-requisitions/${id}/cancel`), {});
  revalidatePath("/stock-purchases");
}

// ── Local Purchase Orders (LPO) ─────────────────────────────────────

export async function getLpos(
  page: number = 0,
  size: number = 20,
  status?: string,
): Promise<ApiResponse<Lpo>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", "createdAt");
  params.set("sortDirection", "desc");
  if (status) params.set("status", status);

  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`/api/v1/lpos?${params.toString()}`));
  return parseStringify(data);
}

export async function getLpo(id: string): Promise<Lpo | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/lpos/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createLpo(data: Record<string, unknown>): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl("/api/v1/lpos"), data);
  revalidatePath("/stock-purchases");
}

export async function updateLpoStatus(id: string, status: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.put(inventoryUrl(`/api/v1/lpos/${id}/status`), { status });
  revalidatePath("/stock-purchases");
}

export async function deleteLpo(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/lpos/${id}`));
  revalidatePath("/stock-purchases");
}

// ── Goods Received Notes (GRN) ──────────────────────────────────────

export async function getGrns(
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<Grn>> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(
    inventoryUrl(`/api/v1/grns?page=${page}&size=${size}&sortBy=createdAt&sortDirection=desc`),
  );
  return parseStringify(data);
}

export async function getGrn(id: string): Promise<Grn | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/grns/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createGrn(data: Record<string, unknown>): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl("/api/v1/grns"), {
    locationType: "LOCATION",
    ...data,
  });
  revalidatePath("/goods-received");
}

export async function receiveGrn(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/grns/${id}/receive`), {});
  revalidatePath("/goods-received");
}

export async function cancelGrn(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/grns/${id}/cancel`), {});
  revalidatePath("/goods-received");
}

// ── Supplier Orders ─────────────────────────────────────────────────

export async function getSupplierOrders(
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<SupplierOrder>> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(
    inventoryUrl(`/api/v1/supplier-orders?page=${page}&size=${size}&sortBy=createdAt&sortDirection=desc`),
  );
  return parseStringify(data);
}

export async function getSupplierOrder(id: string): Promise<SupplierOrder | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/supplier-orders/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createSupplierOrder(data: Record<string, unknown>): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl("/api/v1/supplier-orders"), {
    locationType: "LOCATION",
    ...data,
  });
  revalidatePath("/stock-purchases");
}

export async function submitSupplierOrder(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/supplier-orders/${id}/submit`), {});
  revalidatePath("/stock-purchases");
}

export async function confirmSupplierOrder(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/supplier-orders/${id}/confirm`), {});
  revalidatePath("/stock-purchases");
}

export async function cancelSupplierOrder(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/supplier-orders/${id}/cancel`), {});
  revalidatePath("/stock-purchases");
}
