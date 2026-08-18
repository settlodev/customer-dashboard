"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  BusinessNote,
  BusinessNotePage,
  CreateBusinessNoteRequest,
  UpdateBusinessNoteRequest,
} from "@/types/admin/business-note";
import {
  CreateBusinessNoteSchema,
  UpdateBusinessNoteSchema,
} from "@/types/admin/business-note-schemas";

function staffClient() {
  return new ApiClient("accounts", "staff");
}

function basePath(businessId: string): string {
  return `/api/v1/admin/businesses/${businessId}/notes`;
}

function revalidate(businessId: string) {
  revalidatePath(`/admin/businesses/${businessId}`);
}

export async function listBusinessNotes(
  businessId: string,
  page = 0,
  size = 50,
): Promise<BusinessNotePage> {
  const qs = new URLSearchParams();
  qs.set("page", String(Math.max(0, page)));
  qs.set("size", String(size));
  const data = await staffClient().get<BusinessNotePage>(
    `${basePath(businessId)}?${qs.toString()}`,
  );
  return parseStringify(data);
}

export async function createBusinessNote(
  businessId: string,
  payload: z.infer<typeof CreateBusinessNoteSchema>,
): Promise<FormResponse<BusinessNote>> {
  const validated = CreateBusinessNoteSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid note",
      error: new Error(validated.error.message),
    });
  }

  try {
    const body: CreateBusinessNoteRequest = validated.data;
    const created = await staffClient().post<BusinessNote, CreateBusinessNoteRequest>(
      basePath(businessId),
      body,
    );
    revalidate(businessId);
    return parseStringify({
      responseType: "success",
      message: "Note added",
      data: created,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to add note",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateBusinessNote(
  businessId: string,
  noteId: string,
  payload: z.infer<typeof UpdateBusinessNoteSchema>,
): Promise<FormResponse<BusinessNote>> {
  const validated = UpdateBusinessNoteSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Invalid note",
      error: new Error(validated.error.message),
    });
  }

  try {
    const body: UpdateBusinessNoteRequest = validated.data;
    const updated = await staffClient().patch<BusinessNote, UpdateBusinessNoteRequest>(
      `${basePath(businessId)}/${noteId}`,
      body,
    );
    revalidate(businessId);
    return parseStringify({
      responseType: "success",
      message: "Note updated",
      data: updated,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update note",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteBusinessNote(
  businessId: string,
  noteId: string,
): Promise<FormResponse<void>> {
  try {
    await staffClient().delete<void>(`${basePath(businessId)}/${noteId}`);
    revalidate(businessId);
    return parseStringify({
      responseType: "success",
      message: "Note deleted",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to delete note",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function setBusinessNotePinned(
  businessId: string,
  noteId: string,
  pinned: boolean,
): Promise<FormResponse<BusinessNote>> {
  try {
    const path = pinned ? "pin" : "unpin";
    const updated = await staffClient().post<BusinessNote, Record<string, never>>(
      `${basePath(businessId)}/${noteId}/${path}`,
      {},
    );
    revalidate(businessId);
    return parseStringify({
      responseType: "success",
      message: pinned ? "Note pinned" : "Note unpinned",
      data: updated,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update note",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
