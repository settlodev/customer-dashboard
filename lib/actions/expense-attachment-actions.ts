"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type { ExpenseAttachment } from "@/types/expense/type";

import { accountingUrl } from "./accounting-client";

export interface ExpenseAttachmentMetadata {
  url: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
}

export async function listExpenseAttachments(
  expenseId: string,
): Promise<ExpenseAttachment[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/expenses/${expenseId}/attachments`),
    );
    return (parseStringify(data) as ExpenseAttachment[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Register one or more attachments against an expense after the
 * browser has streamed the file(s) directly to R2 via presigned URLs.
 * Replaces the legacy multipart endpoint — the backing controller now
 * persists metadata only.
 */
export async function registerExpenseAttachments(
  expenseId: string,
  attachments: ExpenseAttachmentMetadata[],
): Promise<FormResponse<ExpenseAttachment[]>> {
  if (!attachments.length) {
    return { responseType: "error", message: "No attachments to register" };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/expenses/${expenseId}/attachments`),
      { attachments },
    )) as ExpenseAttachment[];
    revalidatePath(`/expenses/${expenseId}`);
    return {
      responseType: "success",
      message:
        attachments.length === 1
          ? "Attachment uploaded"
          : `${attachments.length} attachments uploaded`,
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("registerExpenseAttachments failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to register attachment",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteExpenseAttachment(
  expenseId: string,
  attachmentId: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      accountingUrl(`/api/v1/expenses/attachments/${attachmentId}`),
    );
    revalidatePath(`/expenses/${expenseId}`);
    return { responseType: "success", message: "Attachment removed" };
  } catch (error: unknown) {
    return {
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to remove attachment",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
