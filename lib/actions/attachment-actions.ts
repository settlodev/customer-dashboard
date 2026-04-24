"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { inventoryUrl } from "./inventory-client";
import type {
  Attachment,
  AttachmentEntityType,
} from "@/types/attachment/type";
import { ATTACHMENT_MAX_BYTES } from "@/types/attachment/type";

const BASE = "/api/v1/attachments";

function pathFor(entityType: AttachmentEntityType): string {
  // Each entity type lives under its own detail route, so revalidating the
  // section root is enough.
  switch (entityType) {
    case "GRN":
      return "/goods-received";
    case "LPO":
      return "/purchase-orders";
    case "STOCK_MODIFICATION":
      return "/stock-modifications";
    case "STOCK_TRANSFER":
      return "/stock-transfers";
    case "SUPPLIER_RETURN":
      return "/supplier-returns";
    case "OPENING_STOCK":
      return "/stock-intakes";
    case "STOCK_TAKE":
      return "/stock-takes";
    case "PRODUCT":
      return "/products";
    case "BATCH_RECALL":
      return "/stock-batches";
  }
}

export async function listAttachments(
  entityType: AttachmentEntityType,
  entityId: string,
): Promise<Attachment[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`${BASE}/${entityType}/${entityId}`),
    );
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

/**
 * Upload accepts a FormData (from the client) and the target entity. The
 * client sends `file` as a form field — we just pass it through. Because
 * Next.js can't serialise a File inside a normal server-action argument, the
 * wrapper takes the raw FormData.
 */
export async function uploadAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  formData: FormData,
): Promise<FormResponse<Attachment>> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { responseType: "error", message: "No file selected" };
  }
  if (file.size === 0) {
    return { responseType: "error", message: "File is empty" };
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return {
      responseType: "error",
      message: "File exceeds the 10 MB limit",
    };
  }

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`${BASE}/${entityType}/${entityId}`),
      formData,
    )) as Attachment;
    revalidatePath(pathFor(entityType));
    return {
      responseType: "success",
      message: "Attachment uploaded",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to upload file",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteAttachment(
  attachmentId: string,
  entityType?: AttachmentEntityType,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(inventoryUrl(`${BASE}/${attachmentId}`));
    if (entityType) revalidatePath(pathFor(entityType));
    return { responseType: "success", message: "Attachment removed" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to remove file",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Compose the URL used by <img>, <iframe>, and window.open for inline
 * preview. Prefers the server-supplied CDN URL (R2) when present,
 * otherwise routes through our same-origin Next.js proxy so the browser
 * doesn't need to send auth headers it doesn't have.
 */
export async function getAttachmentDownloadHref(
  attachment: Attachment,
): Promise<string> {
  if (attachment.url) return attachment.url;
  return `/api/attachments/${attachment.id}`;
}

/** Same as getAttachmentDownloadHref but forces a file-save disposition. */
export async function getAttachmentSaveHref(
  attachment: Attachment,
): Promise<string> {
  if (attachment.url) return attachment.url;
  return `/api/attachments/${attachment.id}?disposition=attachment`;
}
