"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type { ExpenseCategory } from "@/types/expense-category/type";
import { ExpenseCategorySchema } from "@/types/expense-category/schema";

import { accountingUrl } from "./accounting-client";

export async function listExpenseCategories(
  page = 0,
  size = 100,
): Promise<ApiResponse<ExpenseCategory>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/expense-categories?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    console.error("listExpenseCategories failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: 0, pageSize: size },
      last: true,
    } as unknown as ApiResponse<ExpenseCategory>;
  }
}

export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  const result = await listExpenseCategories(0, 200);
  return result.content ?? [];
}

export async function fetchRootExpenseCategories(): Promise<ExpenseCategory[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/expense-categories/roots`),
    );
    return (parseStringify(data) as ExpenseCategory[]) ?? [];
  } catch {
    return [];
  }
}

export async function createExpenseCategory(
  values: z.infer<typeof ExpenseCategorySchema>,
): Promise<FormResponse<ExpenseCategory>> {
  const parsed = ExpenseCategorySchema.safeParse(values);
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
      accountingUrl("/api/v1/expense-categories"),
      sanitize(parsed.data),
    )) as ExpenseCategory;
    revalidatePath("/settings");
    revalidatePath("/expenses");
    return {
      responseType: "success",
      message: "Category created",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to create category");
  }
}

export async function updateExpenseCategory(
  id: string,
  values: z.infer<typeof ExpenseCategorySchema>,
): Promise<FormResponse<ExpenseCategory>> {
  const parsed = ExpenseCategorySchema.safeParse(values);
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
      accountingUrl(`/api/v1/expense-categories/${id}`),
      sanitize(parsed.data),
    )) as ExpenseCategory;
    revalidatePath("/settings");
    revalidatePath("/expenses");
    return {
      responseType: "success",
      message: "Category updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to update category");
  }
}

export async function deleteExpenseCategory(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(accountingUrl(`/api/v1/expense-categories/${id}`));
    revalidatePath("/settings");
    return { responseType: "success", message: "Category deleted" };
  } catch (error: unknown) {
    return errResp(error, "Failed to delete category");
  }
}

function sanitize(values: z.infer<typeof ExpenseCategorySchema>) {
  return {
    ...values,
    description: values.description || undefined,
    code: values.code || undefined,
    parentId: values.parentId || undefined,
    chartOfAccountId: values.chartOfAccountId || undefined,
  };
}

function errResp(error: unknown, fallback: string): FormResponse<ExpenseCategory> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
