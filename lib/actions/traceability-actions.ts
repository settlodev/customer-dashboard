"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { inventoryUrl } from "./inventory-client";
import type {
  AffectedOrder,
  BatchImpact,
  BatchMovement,
  SerialEvent,
  SerialNumber,
  StockBatchSummary,
} from "@/types/traceability/type";

type ServerPage<T> = { content: T[]; totalElements?: number };

/**
 * Result wrapper so callers can distinguish "got everything" from "here's the
 * first N, more exist" and render an appropriate "refine your search" hint.
 */
export interface PagedResult<T> {
  items: T[];
  totalElements: number;
  returned: number;
  truncated: boolean;
}

function toPagedResult<T>(data: ServerPage<T> | undefined | null): PagedResult<T> {
  const items = (data?.content ?? []) as T[];
  const totalElements = data?.totalElements ?? items.length;
  return {
    items,
    totalElements,
    returned: items.length,
    truncated: totalElements > items.length,
  };
}

function messageFrom(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string") return maybe.message;
  }
  return fallback;
}

// ── Serial search ──────────────────────────────────────────────────

export async function searchSerialNumbers(
  serialNumber: string,
  page: number = 0,
  size: number = 50,
): Promise<FormResponse<PagedResult<SerialNumber>>> {
  if (!serialNumber.trim()) {
    return {
      responseType: "success",
      message: "",
      data: { items: [], totalElements: 0, returned: 0, truncated: false },
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<ServerPage<SerialNumber>>(
      inventoryUrl(
        `/api/v1/serial-numbers/search?serialNumber=${encodeURIComponent(serialNumber.trim())}&page=${page}&size=${size}`,
      ),
    );
    return {
      responseType: "success",
      message: "",
      data: toPagedResult(parseStringify(data)),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Serial search failed"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function fetchSerialEvents(
  variantId: string,
  serialNumber: string,
  page: number = 0,
  size: number = 50,
): Promise<FormResponse<PagedResult<SerialEvent>>> {
  if (!variantId || !serialNumber) {
    return {
      responseType: "success",
      message: "",
      data: { items: [], totalElements: 0, returned: 0, truncated: false },
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<ServerPage<SerialEvent>>(
      inventoryUrl(
        `/api/v1/serial-numbers/variants/${variantId}/serial/${encodeURIComponent(serialNumber)}/events?page=${page}&size=${size}`,
      ),
    );
    return {
      responseType: "success",
      message: "",
      data: toPagedResult(parseStringify(data)),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not load event history"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ── Batch recall ───────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function findBatchesByNumber(
  batchNumber: string,
  page: number = 0,
  size: number = 50,
): Promise<FormResponse<PagedResult<StockBatchSummary>>> {
  const trimmed = batchNumber.trim();
  if (!trimmed) {
    return {
      responseType: "success",
      message: "",
      data: { items: [], totalElements: 0, returned: 0, truncated: false },
    };
  }

  // Convenience: if the user pastes a UUID (e.g. from a URL or log line) fetch
  // that exact batch. Otherwise treat the input as a batch-number substring
  // against the business-scoped endpoint — matches recall scope, unlike the
  // location-scoped plain /stock-batches list.
  if (UUID_RE.test(trimmed)) {
    const byId = await fetchBatchById(trimmed);
    if (byId.responseType === "error") {
      return {
        responseType: "error",
        message: byId.message,
        error: byId.error,
      };
    }
    const items = byId.data ? [byId.data] : [];
    return {
      responseType: "success",
      message: "",
      data: {
        items,
        totalElements: items.length,
        returned: items.length,
        truncated: false,
      },
    };
  }

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<ServerPage<StockBatchSummary>>(
      inventoryUrl(
        `/api/v1/stock-batches/search?batchNumber=${encodeURIComponent(trimmed)}&page=${page}&size=${size}&sortBy=createdAt&sortDirection=desc`,
      ),
    );
    return {
      responseType: "success",
      message: "",
      data: toPagedResult(parseStringify(data)),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not search batches"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function fetchBatchById(
  batchId: string,
): Promise<FormResponse<StockBatchSummary>> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<StockBatchSummary>(
      inventoryUrl(`/api/v1/stock-batches/${batchId}`),
    );
    return {
      responseType: "success",
      message: "",
      data: parseStringify(data),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not load batch"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function fetchBatchMovements(
  batchId: string,
  page: number = 0,
  size: number = 50,
): Promise<FormResponse<PagedResult<BatchMovement>>> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<ServerPage<BatchMovement>>(
      inventoryUrl(
        `/api/v1/stock-movements/by-batch/${batchId}?page=${page}&size=${size}`,
      ),
    );
    return {
      responseType: "success",
      message: "",
      data: toPagedResult(parseStringify(data)),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not load batch movements"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function fetchBatchImpact(
  batchNumber: string,
  windowDays: number | null = 90,
): Promise<FormResponse<BatchImpact>> {
  if (!batchNumber.trim()) {
    return {
      responseType: "error",
      message: "Batch number is required",
    };
  }
  try {
    const apiClient = new ApiClient();
    let url = `/api/v1/stock-batches/impact?batchNumber=${encodeURIComponent(batchNumber.trim())}`;
    if (windowDays && windowDays > 0) {
      // Honest window: recalls usually care about the period since the
      // stock went bad, not all-time. Default 90 days. Pass null for
      // the full history view.
      const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
      url += `&from=${encodeURIComponent(from.toISOString())}`;
    }
    const data = await apiClient.get<BatchImpact>(inventoryUrl(url));
    return { responseType: "success", message: "", data: parseStringify(data) };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not load batch impact"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function fetchRecallRegister(
  fromIso: string | null,
  toIso: string | null,
  page: number = 0,
  size: number = 50,
): Promise<FormResponse<PagedResult<StockBatchSummary>>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (fromIso) params.set("from", fromIso);
    if (toIso) params.set("to", toIso);
    const data = await apiClient.get<ServerPage<StockBatchSummary>>(
      inventoryUrl(`/api/v1/stock-batches/recalls?${params.toString()}`),
    );
    return {
      responseType: "success",
      message: "",
      data: toPagedResult(parseStringify(data)),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not load recall register"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function fetchAffectedOrders(
  batchId: string,
  windowDays: number | null = 90,
): Promise<FormResponse<AffectedOrder[]>> {
  try {
    const apiClient = new ApiClient();
    let url = `/api/v1/stock-batches/${batchId}/affected-orders`;
    if (windowDays && windowDays > 0) {
      const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
      url += `?from=${encodeURIComponent(from.toISOString())}`;
    }
    const data = await apiClient.get<AffectedOrder[]>(inventoryUrl(url));
    return {
      responseType: "success",
      message: "",
      data: parseStringify(data) ?? [],
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not load affected orders"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function fetchBatchesByGrn(
  grnId: string,
): Promise<FormResponse<StockBatchSummary[]>> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<StockBatchSummary[]>(
      inventoryUrl(`/api/v1/stock-batches/by-grn/${grnId}`),
    );
    return {
      responseType: "success",
      message: "",
      data: parseStringify(data) ?? [],
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not load batches for GRN"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function fetchBatchesBySupplier(
  supplierId: string,
  receivedAfterIso: string | null = null,
  receivedBeforeIso: string | null = null,
  page: number = 0,
  size: number = 50,
): Promise<FormResponse<PagedResult<StockBatchSummary>>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (receivedAfterIso) params.set("receivedAfter", receivedAfterIso);
    if (receivedBeforeIso) params.set("receivedBefore", receivedBeforeIso);
    const data = await apiClient.get<ServerPage<StockBatchSummary>>(
      inventoryUrl(
        `/api/v1/stock-batches/by-supplier/${supplierId}?${params.toString()}`,
      ),
    );
    return {
      responseType: "success",
      message: "",
      data: toPagedResult(parseStringify(data)),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not load supplier batches"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function recallBySupplier(
  supplierId: string,
  reason: string,
  receivedAfterIso: string | null = null,
  receivedBeforeIso: string | null = null,
): Promise<FormResponse<StockBatchSummary[]>> {
  const trimmed = reason.trim();
  if (!supplierId) {
    return { responseType: "error", message: "Supplier is required" };
  }
  if (!trimmed) {
    return {
      responseType: "error",
      message: "Please provide a reason for the supplier-wide recall",
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`/api/v1/stock-batches/recall-by-supplier`),
      {
        supplierId,
        reason: trimmed,
        receivedAfter: receivedAfterIso,
        receivedBefore: receivedBeforeIso,
      },
    )) as StockBatchSummary[];
    revalidatePath("/traceability");
    return {
      responseType: "success",
      message: `Recalled ${data?.length ?? 0} batch record(s) from this supplier`,
      data: parseStringify(data),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Supplier-wide recall failed"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Download the recall register CSV. Returns a Buffer + filename; page
 * route exposes it via a Content-Disposition response.
 */
export async function downloadRecallRegisterCsv(
  fromIso: string | null,
  toIso: string | null,
): Promise<FormResponse<{ data: string; filename: string }>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (fromIso) params.set("from", fromIso);
    if (toIso) params.set("to", toIso);
    const qs = params.toString();
    const res = await apiClient.downloadFile(
      inventoryUrl(
        `/api/v1/stock-batches/recalls.csv${qs ? `?${qs}` : ""}`,
      ),
      "text/csv",
    );
    return {
      responseType: "success",
      message: "",
      data: {
        data: res.data.toString("base64"),
        filename: res.filename || "batch-recalls.csv",
      },
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Could not download CSV"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function recallBatch(
  batchNumber: string,
  reason: string,
): Promise<FormResponse<StockBatchSummary[]>> {
  const trimmedNumber = batchNumber.trim();
  const trimmedReason = reason.trim();
  if (!trimmedNumber) {
    return { responseType: "error", message: "Batch number is required" };
  }
  if (!trimmedReason) {
    return {
      responseType: "error",
      message: "Please provide a reason for the recall",
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`/api/v1/stock-batches/recall`),
      { batchNumber: trimmedNumber, reason: trimmedReason },
    )) as StockBatchSummary[];
    revalidatePath("/traceability");
    return {
      responseType: "success",
      message: `Recalled ${data?.length ?? 0} batch record(s) across locations`,
      data: parseStringify(data),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Failed to recall batch"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function revertBatchRecall(
  batchNumber: string,
  reason: string,
): Promise<FormResponse<StockBatchSummary[]>> {
  const trimmedNumber = batchNumber.trim();
  const trimmedReason = reason.trim();
  if (!trimmedNumber) {
    return { responseType: "error", message: "Batch number is required" };
  }
  if (!trimmedReason) {
    return {
      responseType: "error",
      message: "Please provide a reason for reverting the recall",
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`/api/v1/stock-batches/revert-recall`),
      { batchNumber: trimmedNumber, reason: trimmedReason },
    )) as StockBatchSummary[];
    revalidatePath("/traceability");
    return {
      responseType: "success",
      message: `Reverted recall on ${data?.length ?? 0} batch record(s)`,
      data: parseStringify(data),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: messageFrom(error, "Failed to revert recall"),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
