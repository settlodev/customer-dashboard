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
  Rfq,
  RfqStatus,
  QuoteComparison,
  SupplierQuote,
  CreateRfqPayload,
  SubmitQuotePayload,
  AwardQuotePayload,
} from "@/types/rfq/type";
import {
  CreateRfqSchema,
  SubmitQuoteSchema,
  AwardQuoteSchema,
} from "@/types/rfq/schema";

const BASE = "/api/v1/rfqs";

// ── List / read ─────────────────────────────────────────────────────

export async function getRfqs(
  page: number = 0,
  size: number = 20,
  status?: RfqStatus,
): Promise<ApiResponse<Rfq>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", "createdAt");
  params.set("sortDirection", "DESC");
  if (status) params.set("status", status);

  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`${BASE}?${params.toString()}`));
  return parseStringify(data);
}

export async function getRfq(id: string): Promise<Rfq | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`${BASE}/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function compareRfqQuotes(id: string): Promise<QuoteComparison | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`${BASE}/${id}/compare`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

// ── Mutations ───────────────────────────────────────────────────────

export async function createRfq(
  input: z.infer<typeof CreateRfqSchema>,
): Promise<FormResponse | void> {
  const validated = CreateRfqSchema.safeParse(input);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    });
  }

  const payload: CreateRfqPayload = {
    locationType: (await getCurrentDestination())?.type ?? "LOCATION",
    ...validated.data,
    items: validated.data.items.map((item) => ({
      ...item,
      specifications: item.specifications || undefined,
    })),
    invitedSupplierIds:
      validated.data.invitedSupplierIds && validated.data.invitedSupplierIds.length > 0
        ? validated.data.invitedSupplierIds
        : undefined,
    submissionDeadline: validated.data.submissionDeadline
      ? new Date(validated.data.submissionDeadline).toISOString()
      : undefined,
    requiredByDate: validated.data.requiredByDate || undefined,
  };

  let createdId: string | null = null;
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(inventoryUrl(BASE), payload)) as Rfq;
    createdId = created?.id ?? null;
    revalidatePath("/rfqs");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create RFQ",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
  redirect(createdId ? `/rfqs/${createdId}` : "/rfqs");
}

export async function sendRfq(id: string): Promise<FormResponse> {
  return runTransition(id, "send", "Sent to suppliers");
}

export async function evaluateRfq(id: string): Promise<FormResponse> {
  return runTransition(id, "evaluate", "Marked as evaluated");
}

export async function convertRfqToLpo(id: string): Promise<FormResponse> {
  return runTransition(id, "convert-to-lpo", "Converted to LPO");
}

export async function cancelRfq(id: string): Promise<FormResponse> {
  return runTransition(id, "cancel", "Cancelled");
}

async function runTransition(
  id: string,
  verb: "send" | "evaluate" | "convert-to-lpo" | "cancel",
  label: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/${verb}`), {});
    revalidatePath(`/rfqs/${id}`);
    revalidatePath("/rfqs");
    return { responseType: "success", message: label };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? `Failed to ${label.toLowerCase()}`,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function submitRfqQuote(
  rfqId: string,
  input: z.infer<typeof SubmitQuoteSchema>,
): Promise<FormResponse<SupplierQuote>> {
  const validated = SubmitQuoteSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    };
  }

  const { supplierId, ...rest } = validated.data;
  const payload: SubmitQuotePayload = {
    ...rest,
    currency: rest.currency || undefined,
    validityDate: rest.validityDate || undefined,
    items: rest.items.map((item) => ({
      ...item,
      currency: item.currency || undefined,
    })),
  };

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(
        `${BASE}/${rfqId}/quotes?supplierId=${encodeURIComponent(supplierId)}`,
      ),
      payload,
    )) as SupplierQuote;
    revalidatePath(`/rfqs/${rfqId}`);
    return {
      responseType: "success",
      message: "Quote submitted",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to submit quote",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function awardRfq(
  rfqId: string,
  input: z.infer<typeof AwardQuoteSchema>,
): Promise<FormResponse> {
  const validated = AwardQuoteSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Select a quote to award",
      error: new Error(validated.error.message),
    };
  }

  const payload: AwardQuotePayload = validated.data;

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${rfqId}/award`), payload);
    revalidatePath(`/rfqs/${rfqId}`);
    revalidatePath("/rfqs");
    return { responseType: "success", message: "RFQ awarded" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to award RFQ",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
