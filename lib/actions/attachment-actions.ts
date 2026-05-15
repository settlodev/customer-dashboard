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
    case "STOCK_USAGE":
      return "/stock-usages";
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

export interface InventoryAttachmentMetadata {
  url: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
}

/**
 * Register an attachment against an inventory entity after the browser
 * has streamed the file directly to R2 via a presigned URL. Replaces
 * the legacy multipart endpoint — the backing controller now persists
 * metadata only.
 */
export async function registerAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  metadata: InventoryAttachmentMetadata,
): Promise<FormResponse<Attachment>> {
  if (metadata.size > ATTACHMENT_MAX_BYTES) {
    return {
      responseType: "error",
      message: "File exceeds the 10 MB limit",
    };
  }

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`${BASE}/${entityType}/${entityId}`),
      metadata,
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
      message: error?.message ?? "Failed to register attachment",
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
