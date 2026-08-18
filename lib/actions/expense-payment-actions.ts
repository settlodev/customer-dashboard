"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type { ExpensePayment } from "@/types/expense-payment/type";
import { ExpensePaymentSchema } from "@/types/expense/schema";

import { accountingUrl } from "./accounting-client";

export async function listExpensePayments(
  expenseId: string,
): Promise<ExpensePayment[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/expenses/${expenseId}/payments`),
    );
    return (parseStringify(data) as ExpensePayment[]) ?? [];
  } catch (error) {
    console.error("listExpensePayments failed", error);
    return [];
  }
}

export async function recordExpensePayment(
  expenseId: string,
  values: z.infer<typeof ExpensePaymentSchema>,
): Promise<FormResponse<ExpensePayment>> {
  const parsed = ExpensePaymentSchema.safeParse(values);
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
      reference: parsed.data.reference || undefined,
      notes: parsed.data.notes || undefined,
      paymentMethod: parsed.data.paymentMethod || undefined,
    };
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/expenses/${expenseId}/payments`),
      payload,
    )) as ExpensePayment;
    revalidatePath(`/expenses/${expenseId}`);
    revalidatePath("/expenses");
    return {
      responseType: "success",
      message: "Payment recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("recordExpensePayment failed", error);
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to record payment",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteExpensePayment(
  expenseId: string,
  paymentId: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      accountingUrl(`/api/v1/expenses/${expenseId}/payments/${paymentId}`),
    );
    revalidatePath(`/expenses/${expenseId}`);
    return { responseType: "success", message: "Payment removed" };
  } catch (error: unknown) {
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to delete payment",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
