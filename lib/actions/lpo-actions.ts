"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inventoryUrl } from "./inventory-client";
import type {
  Lpo,
  LpoStatus,
  CreateLpoPayload,
  UpdateLpoStatusPayload,
} from "@/types/lpo/type";
import { CreateLpoSchema, UpdateLpoStatusSchema } from "@/types/lpo/schema";

const BASE = "/api/v1/lpos";

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
  } catch {
    return null;
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
    locationType: "LOCATION",
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
    revalidatePath("/stock-purchases");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create LPO",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  redirect(createdId ? `/stock-purchases/${createdId}` : "/stock-purchases");
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
    revalidatePath("/stock-purchases");
    revalidatePath(`/stock-purchases/${id}`);
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
    revalidatePath("/stock-purchases");
    return { responseType: "success", message: "LPO deleted" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to delete LPO",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
