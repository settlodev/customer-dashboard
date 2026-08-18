"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type { ExpenseCreditNote } from "@/types/expense-credit-note/type";
import { ExpenseCreditNoteSchema } from "@/types/expense/schema";

import { accountingUrl } from "./accounting-client";

export async function listExpenseCreditNotes(
  expenseId: string,
): Promise<ExpenseCreditNote[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/expenses/${expenseId}/credit-notes`),
    );
    return (parseStringify(data) as ExpenseCreditNote[]) ?? [];
  } catch (error) {
    console.error("listExpenseCreditNotes failed", error);
    return [];
  }
}

export async function recordExpenseCreditNote(
  expenseId: string,
  values: z.infer<typeof ExpenseCreditNoteSchema>,
): Promise<FormResponse<ExpenseCreditNote>> {
  const parsed = ExpenseCreditNoteSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }

  try {
    const apiClient = new ApiClient();
    const payload = {
      ...parsed.data,
      offsetChartOfAccountId: parsed.data.offsetChartOfAccountId || undefined,
      reference: parsed.data.reference || undefined,
      notes: parsed.data.notes || undefined,
    };
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/expenses/${expenseId}/credit-notes`),
      payload,
    )) as ExpenseCreditNote;
    revalidatePath(`/expenses/${expenseId}`);
    revalidatePath("/expenses");
    return {
      responseType: "success",
      message: "Credit note recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("recordExpenseCreditNote failed", error);
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to record credit note",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteExpenseCreditNote(
  expenseId: string,
  creditNoteId: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      accountingUrl(`/api/v1/expenses/${expenseId}/credit-notes/${creditNoteId}`),
    );
    revalidatePath(`/expenses/${expenseId}`);
    return { responseType: "success", message: "Credit note removed" };
  } catch (error: unknown) {
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to delete credit note",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
