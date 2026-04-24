"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  StockIntakeRecord,
  StockIntakeRecordStatus,
} from "@/types/stock-intake-record/type";
import { StockIntakeRecordSchema } from "@/types/stock-intake-record/schema";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";

export async function searchStockIntakeRecords(
  page: number = 0,
  size: number = 20,
  status?: StockIntakeRecordStatus,
): Promise<ApiResponse<StockIntakeRecord>> {
  const apiClient = new ApiClient();
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", "createdAt");
  params.set("sortDirection", "desc");
  if (status) params.set("status", status);

  const data = await apiClient.get(
    inventoryUrl(`/api/v1/stock-intakes?${params.toString()}`),
  );
  return parseStringify(data);
}

export async function getStockIntakeRecord(
  id: string,
): Promise<StockIntakeRecord | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/stock-intakes/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createStockIntakeRecord(
  stockIntake: z.infer<typeof StockIntakeRecordSchema>,
): Promise<FormResponse | void> {
  const validated = StockIntakeRecordSchema.safeParse(stockIntake);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  let createdId: string | null = null;
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(inventoryUrl("/api/v1/stock-intakes"), {
      locationType: (await getCurrentDestination())?.type ?? "LOCATION",
      ...validated.data,
    })) as StockIntakeRecord;
    createdId = created.id;
  } catch (error: unknown) {
    const err = error as {
      digest?: string;
      message?: string;
      code?: string;
      metadata?: Record<string, unknown>;
    };
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: err?.message ?? "Failed to create stock intake",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: err?.code,
      metadata: err?.metadata,
    });
  }

  revalidatePath("/stock-intakes");
  redirect(`/stock-intakes/${createdId}`);
}

export async function confirmStockIntakeRecord(id: string): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/stock-intakes/${id}/confirm`), {});
  } catch (error: unknown) {
    return parseStringify({
      responseType: "error",
      message:
        (error as { message?: string })?.message ??
        "Failed to confirm stock intake",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
  revalidatePath("/stock-intakes");
  revalidatePath(`/stock-intakes/${id}`);
  return parseStringify({
    responseType: "success",
    message: "Stock intake confirmed — inventory updated.",
  });
}

export async function cancelStockIntakeRecord(id: string): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/stock-intakes/${id}/cancel`), {});
  } catch (error: unknown) {
    return parseStringify({
      responseType: "error",
      message:
        (error as { message?: string })?.message ??
        "Failed to cancel stock intake",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
  revalidatePath("/stock-intakes");
  revalidatePath(`/stock-intakes/${id}`);
  return parseStringify({
    responseType: "success",
    message: "Stock intake cancelled.",
  });
}
