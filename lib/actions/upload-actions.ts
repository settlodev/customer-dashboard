"use server";

import ApiClient from "@/lib/settlo-api-client";
import type {
  UploadPresignResult,
  UploadPurpose,
} from "@/lib/uploads/types";

import { accountingUrl } from "./accounting-client";
import { inventoryUrl } from "./inventory-client";

interface PresignRequestBody {
  purpose: UploadPurpose;
  filename: string;
  contentType: string;
  contentLength: number;
}

export type PresignActionResult =
  | { ok: true; data: UploadPresignResult }
  | { ok: false; message: string };

/**
 * Routes a presign request to the service that owns the upload purpose.
 * The owning service does the tenant-scoping (it reads businessId off
 * the JWT) and signs the R2 PUT URL — nothing here knows about R2.
 */
function resolvePresignUrl(purpose: UploadPurpose): string {
  switch (purpose) {
    case "BUSINESS_LOGO":
    case "LOCATION_LOGO":
    case "PROFILE_PICTURE":
      // ApiClient defaults to ACCOUNTS_SERVICE_URL, so a relative path is enough.
      return "/api/v1/uploads/presign";
    case "PRODUCT_IMAGE":
    case "STOCK_IMAGE":
    case "BRAND_LOGO":
    case "CATEGORY_IMAGE":
    case "DEPARTMENT_IMAGE":
    case "PRODUCT_COLLECTION_IMAGE":
    case "RECEIPT_HEADER":
    case "INVENTORY_ATTACHMENT":
      return inventoryUrl("/api/v1/uploads/presign");
    case "EXPENSE_ATTACHMENT":
      return accountingUrl("/api/v1/uploads/presign");
    default: {
      const _exhaustive: never = purpose;
      throw new Error(`Unhandled upload purpose: ${_exhaustive}`);
    }
  }
}

export async function getUploadPresignUrl(
  body: PresignRequestBody,
): Promise<PresignActionResult> {
  try {
    const url = resolvePresignUrl(body.purpose);
    const apiClient = new ApiClient();
    const data = await apiClient.post<UploadPresignResult, PresignRequestBody>(
      url,
      body,
    );
    return { ok: true, data };
  } catch (error: unknown) {
    console.error("getUploadPresignUrl failed", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to obtain upload URL",
    };
  }
}
