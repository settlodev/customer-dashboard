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
  Lpo,
  LpoStatus,
  PublicLpo,
  CreateLpoPayload,
  UpdateLpoStatusPayload,
  AcknowledgeLpoPayload,
} from "@/types/lpo/type";
import {
  AcknowledgeLpoSchema,
  CreateLpoSchema,
  UpdateLpoStatusSchema,
} from "@/types/lpo/schema";

const BASE = "/api/v1/lpos";
const PUBLIC_BASE = "/api/v1/public/lpos";

// ── List / read ─────────────────────────────────────────────────────

export async function getLpos(
  page: number = 0,
  size: number = 20,
  status?: LpoStatus,
  sortBy: string = "createdAt",
  sortDirection: "asc" | "desc" = "desc",
): Promise<ApiResponse<Lpo>> {
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

export async function getLpo(id: string): Promise<Lpo | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`${BASE}/${id}`));
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/** Fetch all LPOs that are still open for receiving (APPROVED / PARTIALLY_RECEIVED).
 *  Used by the GRN create flow to pre-fill items. */
export async function getOpenLposForReceiving(): Promise<Lpo[]> {
  try {
    const [approved, partial] = await Promise.all([
      getLpos(0, 50, "APPROVED"),
      getLpos(0, 50, "PARTIALLY_RECEIVED"),
    ]);
    return [...(approved.content ?? []), ...(partial.content ?? [])];
  } catch {
    return [];
  }
}

// ── Mutations ───────────────────────────────────────────────────────

export async function createLpo(
  input: z.infer<typeof CreateLpoSchema>,
): Promise<FormResponse | void> {
  const validated = CreateLpoSchema.safeParse(input);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    });
  }

  const payload: CreateLpoPayload = {
    ...validated.data,
    locationType: (await getCurrentDestination())?.type ?? "LOCATION",
    items: validated.data.items.map((item) => ({
      ...item,
      currency: item.currency || undefined,
    })),
  };

  let createdId: string | null = null;
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(inventoryUrl(BASE), payload)) as Lpo;
    createdId = created?.id ?? null;
    revalidatePath("/purchase-orders");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create LPO",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  redirect(createdId ? `/purchase-orders/${createdId}` : "/purchase-orders");
}

export async function updateLpoStatus(
  id: string,
  input: z.infer<typeof UpdateLpoStatusSchema>,
): Promise<FormResponse> {
  const validated = UpdateLpoStatusSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Invalid status",
      error: new Error(validated.error.message),
    };
  }

  const payload: UpdateLpoStatusPayload = validated.data;

  try {
    const apiClient = new ApiClient();
    await apiClient.put(inventoryUrl(`${BASE}/${id}/status`), payload);
    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${id}`);
    return { responseType: "success", message: `LPO marked ${payload.status}` };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to update LPO status",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteLpo(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(inventoryUrl(`${BASE}/${id}`));
    revalidatePath("/purchase-orders");
    return { responseType: "success", message: "LPO deleted" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to delete LPO",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ── Acknowledgement (admin / offline path) ──────────────────────────
//
// Used when the supplier confirms or declines outside the share link
// (phone/email/in person) and a staff member records that decision on
// their behalf. The backend captures X-User-Id for audit.

export async function acknowledgeLpo(
  id: string,
  input: z.infer<typeof AcknowledgeLpoSchema>,
): Promise<FormResponse> {
  const validated = AcknowledgeLpoSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Invalid acknowledgement",
      error: new Error(validated.error.message),
    };
  }

  const payload: AcknowledgeLpoPayload = validated.data;

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/acknowledge`), payload);
    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${id}`);
    return {
      responseType: "success",
      message:
        payload.decision === "ACCEPTED"
          ? "Supplier acceptance recorded"
          : "Supplier rejection recorded",
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to record acknowledgement",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ── Public (supplier-facing) — token-scoped ─────────────────────────
//
// These hit `/api/v1/public/lpos/...` which the inventory service whitelists
// in SecurityConfig. No auth headers required, so we use a plain client to
// skip the proactive refresh path.

export async function getPublicLpo(token: string): Promise<PublicLpo | null> {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    const data = await apiClient.get<PublicLpo>(
      inventoryUrl(`${PUBLIC_BASE}/${encodeURIComponent(token)}`),
    );
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function acknowledgePublicLpo(
  token: string,
  input: z.infer<typeof AcknowledgeLpoSchema>,
): Promise<FormResponse> {
  const validated = AcknowledgeLpoSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Invalid acknowledgement",
      error: new Error(validated.error.message),
    };
  }

  const payload: AcknowledgeLpoPayload = validated.data;

  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    const data = await apiClient.post<PublicLpo, AcknowledgeLpoPayload>(
      inventoryUrl(`${PUBLIC_BASE}/${encodeURIComponent(token)}/acknowledge`),
      payload,
    );
    return {
      responseType: "success",
      message:
        payload.decision === "ACCEPTED"
          ? "Order accepted — thank you"
          : "Order rejected",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Could not record your decision",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ── Sharing (manual mint + revoke from the operator side) ───────────

export async function shareLpo(
  id: string,
): Promise<{ shareToken: string; shareUrl: string } | { error: string }> {
  try {
    const apiClient = new ApiClient();
    const updated = (await apiClient.post(
      inventoryUrl(`${BASE}/${id}/share`),
      {},
    )) as Lpo;
    revalidatePath(`/purchase-orders/${id}`);
    if (!updated?.shareToken) {
      return { error: "Share token missing from server response" };
    }
    return {
      shareToken: updated.shareToken,
      shareUrl: buildLpoShareUrl(updated.shareToken),
    };
  } catch (error: any) {
    return { error: error?.message ?? "Failed to share LPO" };
  }
}

export async function revokeLpoShare(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(inventoryUrl(`${BASE}/${id}/share`));
    revalidatePath(`/purchase-orders/${id}`);
    return { responseType: "success", message: "Share link revoked" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to revoke share link",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

function buildLpoShareUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}/po/${token}`;
}
