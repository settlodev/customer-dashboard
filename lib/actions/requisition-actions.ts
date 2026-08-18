"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";
import type {
  PurchaseRequisition,
  PublicRequisition,
  RequisitionStatus,
  CreateRequisitionPayload,
} from "@/types/requisition/type";
import {
  CreateRequisitionSchema,
  RejectRequisitionSchema,
} from "@/types/requisition/schema";

const BASE = "/api/v1/purchase-requisitions";

export async function getRequisitions(
  page: number = 0,
  size: number = 20,
  status?: RequisitionStatus,
  sortBy: string = "createdAt",
  sortDirection: "asc" | "desc" = "desc",
): Promise<ApiResponse<PurchaseRequisition>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", sortBy);
  params.set("sortDirection", sortDirection);
  if (status) params.set("status", status);

  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`${BASE}?${params.toString()}`));
  return parseStringify(data);
}

export async function getRequisition(id: string): Promise<PurchaseRequisition | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`${BASE}/${id}`));
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function createRequisition(
  input: z.infer<typeof CreateRequisitionSchema>,
): Promise<FormResponse | void> {
  const validated = CreateRequisitionSchema.safeParse(input);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    });
  }

  const payload: CreateRequisitionPayload = {
    locationType: (await getCurrentDestination())?.type ?? "LOCATION",
    ...validated.data,
    items: validated.data.items.map((item) => ({
      ...item,
      preferredSupplierId: item.preferredSupplierId || undefined,
    })),
  };

  let createdId: string | null = null;
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(
      inventoryUrl(BASE),
      payload,
    )) as PurchaseRequisition;
    createdId = created?.id ?? null;
    revalidatePath("/purchase-requisitions");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create requisition",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
  redirect(createdId ? `/purchase-requisitions/${createdId}` : "/purchase-requisitions");
}

export async function submitRequisition(id: string): Promise<FormResponse> {
  return runTransition(id, "submit", "Submitted");
}

export async function approveRequisition(id: string): Promise<FormResponse> {
  return runTransition(id, "approve", "Approved");
}

export async function rejectRequisition(
  id: string,
  input: z.infer<typeof RejectRequisitionSchema>,
): Promise<FormResponse> {
  const validated = RejectRequisitionSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Reason is required",
      error: new Error(validated.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/reject`), validated.data);
    revalidatePath(`/purchase-requisitions/${id}`);
    revalidatePath("/purchase-requisitions");
    return { responseType: "success", message: "Requisition rejected" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to reject",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function convertRequisitionToLpo(id: string): Promise<FormResponse> {
  return runTransition(id, "convert-to-lpo", "Converted to LPO");
}

export async function cancelRequisition(id: string): Promise<FormResponse> {
  return runTransition(id, "cancel", "Cancelled");
}

async function runTransition(
  id: string,
  verb: "submit" | "approve" | "convert-to-lpo" | "cancel",
  label: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/${verb}`), {});
    revalidatePath(`/purchase-requisitions/${id}`);
    revalidatePath("/purchase-requisitions");
    return { responseType: "success", message: `Requisition ${label.toLowerCase()}` };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? `Failed to ${label.toLowerCase()}`,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ── Sharing ─────────────────────────────────────────────────────────

const PUBLIC_BASE = "/api/v1/public/purchase-requisitions";

/**
 * Mint (or return the existing) share token for a requisition. The backend
 * is idempotent — calling this multiple times returns the same token until
 * {@link revokeRequisitionShare} is invoked.
 */
export async function shareRequisition(
  id: string,
): Promise<{ shareToken: string; shareUrl: string } | { error: string }> {
  try {
    const apiClient = new ApiClient();
    const updated = (await apiClient.post(
      inventoryUrl(`${BASE}/${id}/share`),
      {},
    )) as PurchaseRequisition;
    revalidatePath(`/purchase-requisitions/${id}`);
    if (!updated?.shareToken) {
      return { error: "Share token missing from server response" };
    }
    return {
      shareToken: updated.shareToken,
      shareUrl: buildShareUrl(updated.shareToken),
    };
  } catch (error: any) {
    return { error: error?.message ?? "Failed to share requisition" };
  }
}

/**
 * Revoke an active share link. The link 404s on the next public lookup.
 */
export async function revokeRequisitionShare(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(inventoryUrl(`${BASE}/${id}/share`));
    revalidatePath(`/purchase-requisitions/${id}`);
    return { responseType: "success", message: "Share link revoked" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to revoke share link",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Public lookup by share token. No tenant scoping — the token itself is
 * the capability. Returns null on 404 (revoked or never minted).
 */
export async function getPublicRequisition(
  token: string,
): Promise<PublicRequisition | null> {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    const data = await apiClient.get<PublicRequisition>(
      inventoryUrl(`${PUBLIC_BASE}/${encodeURIComponent(token)}`),
    );
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

function buildShareUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}/pr/${token}`;
}
