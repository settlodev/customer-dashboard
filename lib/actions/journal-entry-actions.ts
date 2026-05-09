"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type { JournalEntry, JournalEntryStatus } from "@/types/journal-entry/type";
import { JournalEntrySchema } from "@/types/journal-entry/schema";

import { accountingUrl } from "./accounting-client";

interface ListJournalEntriesOpts {
  status?: JournalEntryStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export async function listJournalEntries(
  opts: ListJournalEntriesOpts = {},
): Promise<ApiResponse<JournalEntry>> {
  try {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", opts.status);
    params.set("page", String(opts.page ?? 0));
    params.set("size", String(opts.size ?? 20));
    params.set("sortBy", opts.sortBy ?? "entryDate");
    params.set("sortDirection", opts.sortDirection ?? "DESC");

    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/journal-entries?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    console.error("listJournalEntries failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: 0, pageSize: opts.size ?? 20 },
      last: true,
    } as unknown as ApiResponse<JournalEntry>;
  }
}

export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/journal-entries/${id}`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createJournalEntry(
  values: z.infer<typeof JournalEntrySchema>,
): Promise<FormResponse<JournalEntry>> {
  const parsed = JournalEntrySchema.safeParse(values);
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
      accountingUrl("/api/v1/journal-entries"),
      sanitize(parsed.data),
    )) as JournalEntry;
    revalidatePath("/accounting/journal-entries");
    return {
      responseType: "success",
      message: "Journal entry created",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to create journal entry");
  }
}

export async function updateJournalEntry(
  id: string,
  values: z.infer<typeof JournalEntrySchema>,
): Promise<FormResponse<JournalEntry>> {
  const parsed = JournalEntrySchema.safeParse(values);
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
      accountingUrl(`/api/v1/journal-entries/${id}`),
      sanitize(parsed.data),
    )) as JournalEntry;
    revalidatePath("/accounting/journal-entries");
    revalidatePath(`/accounting/journal-entries/${id}`);
    return {
      responseType: "success",
      message: "Journal entry updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to update journal entry");
  }
}

export async function postJournalEntry(
  id: string,
): Promise<FormResponse<JournalEntry>> {
  return workflow(id, "post", "Journal entry posted");
}

export async function voidJournalEntry(
  id: string,
): Promise<FormResponse<JournalEntry>> {
  return workflow(id, "void", "Journal entry voided");
}

export async function deleteJournalEntry(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(accountingUrl(`/api/v1/journal-entries/${id}`));
    revalidatePath("/accounting/journal-entries");
    return { responseType: "success", message: "Journal entry deleted" };
  } catch (error: unknown) {
    return errResp(error, "Failed to delete journal entry");
  }
}

async function workflow(
  id: string,
  action: "post" | "void",
  successMessage: string,
): Promise<FormResponse<JournalEntry>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/journal-entries/${id}/${action}`),
      {},
    )) as JournalEntry;
    revalidatePath("/accounting/journal-entries");
    revalidatePath(`/accounting/journal-entries/${id}`);
    return {
      responseType: "success",
      message: successMessage,
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, `Failed to ${action} journal entry`);
  }
}

function sanitize(values: z.infer<typeof JournalEntrySchema>) {
  return {
    ...values,
    reference: values.reference || undefined,
    lines: values.lines.map((l) => ({
      ...l,
      description: l.description || undefined,
    })),
  };
}

function errResp(error: unknown, fallback: string): FormResponse<JournalEntry> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
