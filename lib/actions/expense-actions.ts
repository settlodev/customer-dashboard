"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type {
  Expense,
  ExpenseStatus,
  ExpenseTimelineEvent,
  PaymentStatus,
} from "@/types/expense/type";
import { ExpenseSchema } from "@/types/expense/schema";

import { accountingUrl } from "./accounting-client";
import { rethrowIfBoundary } from "@/lib/list-fallback";

interface ListExpensesOpts {
  status?: ExpenseStatus;
  paymentStatus?: PaymentStatus;
  vendorId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export async function listExpenses(
  opts: ListExpensesOpts = {},
): Promise<ApiResponse<Expense>> {
  try {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", opts.status);
    if (opts.paymentStatus) params.set("paymentStatus", opts.paymentStatus);
    if (opts.vendorId) params.set("vendorId", opts.vendorId);
    params.set("page", String(opts.page ?? 0));
    params.set("size", String(opts.size ?? 20));
    params.set("sortBy", opts.sortBy ?? "createdAt");
    params.set("sortDirection", opts.sortDirection ?? "DESC");

    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/expenses?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listExpenses failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: 0, pageSize: 20 },
      last: true,
    } as unknown as ApiResponse<Expense>;
  }
}

export async function getExpense(id: string): Promise<Expense | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(accountingUrl(`/api/v1/expenses/${id}`));
    return parseStringify(data);
  } catch (error) {
    console.error("getExpense failed", error);
    return null;
  }
}

export async function createExpense(
  values: z.infer<typeof ExpenseSchema>,
): Promise<FormResponse<Expense>> {
  const parsed = ExpenseSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl("/api/v1/expenses"),
      sanitize(parsed.data),
    )) as Expense;
    revalidatePath("/expenses");
    return {
      responseType: "success",
      message: "Expense created",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse(error, "Failed to create expense");
  }
}

export async function updateExpense(
  id: string,
  values: z.infer<typeof ExpenseSchema>,
): Promise<FormResponse<Expense>> {
  const parsed = ExpenseSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(
      accountingUrl(`/api/v1/expenses/${id}`),
      sanitize(parsed.data),
    )) as Expense;
    revalidatePath("/expenses");
    revalidatePath(`/expenses/${id}`);
    return {
      responseType: "success",
      message: "Expense updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse(error, "Failed to update expense");
  }
}

export async function submitExpense(
  id: string,
): Promise<FormResponse<Expense>> {
  return workflowAction(id, "submit", "Expense submitted for approval");
}

export async function approveExpense(
  id: string,
): Promise<FormResponse<Expense>> {
  return workflowAction(id, "approve", "Expense approved");
}

export async function rejectExpense(
  id: string,
): Promise<FormResponse<Expense>> {
  return workflowAction(id, "reject", "Expense rejected");
}

export async function voidExpense(id: string): Promise<FormResponse<Expense>> {
  return workflowAction(id, "void", "Expense voided");
}

export async function deleteExpense(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(accountingUrl(`/api/v1/expenses/${id}`));
    revalidatePath("/expenses");
    return { responseType: "success", message: "Expense deleted" };
  } catch (error: unknown) {
    return errorResponse(error, "Failed to delete expense");
  }
}

export async function getExpenseTimeline(
  id: string,
): Promise<ExpenseTimelineEvent[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/expenses/${id}/timeline`),
    );
    return (parseStringify(data) as ExpenseTimelineEvent[]) ?? [];
  } catch (error) {
    console.error("getExpenseTimeline failed", error);
    return [];
  }
}

async function workflowAction(
  id: string,
  action: "submit" | "approve" | "reject" | "void",
  successMessage: string,
): Promise<FormResponse<Expense>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/expenses/${id}/${action}`),
      {},
    )) as Expense;
    revalidatePath("/expenses");
    revalidatePath(`/expenses/${id}`);
    return {
      responseType: "success",
      message: successMessage,
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errorResponse(error, `Failed to ${action} expense`);
  }
}

function sanitize(values: z.infer<typeof ExpenseSchema>) {
  return {
    ...values,
    vendorId: values.vendorId || undefined,
    expenseCategoryId: values.expenseCategoryId || undefined,
    chartOfAccountId: values.chartOfAccountId || undefined,
    reference: values.reference || undefined,
    dueDate: values.dueDate || undefined,
  };
}

function errorResponse(
  error: unknown,
  fallback: string,
): FormResponse<Expense> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}

export async function getExpenseByReference(
  reference: string,
): Promise<Expense | null> {
  try {
    const params = new URLSearchParams();
    params.set("reference", reference);
    params.set("size", "1");
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/expenses?${params.toString()}`),
    );
    const page = parseStringify(data) as ApiResponse<Expense>;
    return page.content?.[0] ?? null;
  } catch (error) {
    console.error("getExpenseByReference failed", error);
    return null;
  }
}
