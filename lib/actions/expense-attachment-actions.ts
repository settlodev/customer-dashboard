"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type { ExpenseAttachment } from "@/types/expense/type";

import { accountingUrl } from "./accounting-client";

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

export async function uploadExpenseAttachment(
  expenseId: string,
  formData: FormData,
): Promise<FormResponse<ExpenseAttachment[]>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { responseType: "error", message: "No file selected" };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/expenses/${expenseId}/attachments`),
      formData,
    )) as ExpenseAttachment[];
    revalidatePath(`/expenses/${expenseId}`);
    return {
      responseType: "success",
      message: "Attachment uploaded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("uploadExpenseAttachment failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to upload attachment",
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
