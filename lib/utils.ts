import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { uploadCallBackType } from "@/types/types";
import { v4 } from "uuid";
import { uploadService } from "@/lib/uploads/upload-service";
import type { UploadPurpose } from "@/lib/uploads/types";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseStringify = (value: unknown) =>
  JSON.parse(JSON.stringify(value));

export function safeRandomUUID(): string {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return v4();
}

export function formatNumber(value: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}

export const formatDateTime = (
  date: Date | string | undefined,
): {
  dateTime: string;
  dateDay: string;
  timeOnly: string;
  dateOnly: string;
} => {
  if (!date) return { dateTime: "", dateDay: "", timeOnly: "", dateOnly: "" };

  const dateValue = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateValue.getTime())) {
    return {
      dateTime: "Invalid date",
      dateDay: "Invalid date",
      timeOnly: "Invalid date",
      dateOnly: "Invalid date",
    };
  }

  const formattedDate = format(dateValue, "yyyy-MM-dd");
  const formattedTime = format(dateValue, "HH:mm:ss");
  const formattedDateOnly = format(dateValue, "yyyy-MM-dd");

  return {
    dateTime: `${formattedDate} ${formattedTime}`,
    dateDay: formattedDate,
    timeOnly: formattedTime,
    dateOnly: formattedDateOnly,
  };
};

/**
 * Legacy callback-style helper used by older forms (business_form,
 * UploadImageWidget). Maps the path hint to an {@link UploadPurpose}
 * and delegates to the shared {@link uploadService}, which handles the
 * presigned-URL flow against R2. New callers should consume
 * {@code useUpload()} or {@code uploadService.upload()} directly.
 */
export async function uploadImage(
  file: File,
  path: string,
  callback: (response: uploadCallBackType) => void,
) {
  const purpose = inferUploadPurpose(path);
  if (!purpose) {
    callback({
      success: false,
      data: `Unknown upload destination "${path}". Use uploadService.upload() with an explicit purpose.`,
    });
    return;
  }
  try {
    const result = await uploadService.upload({ file, purpose });
    callback({ success: true, data: result.url });
  } catch (error) {
    callback({
      success: false,
      data: error instanceof Error ? error.message : "Upload failed",
    });
  }
}

/**
 * Maps the legacy free-form `imagePath` string callers used to pass to
 * the upload widgets onto a typed {@link UploadPurpose}. Keep this in
 * sync with the {@code UploadImageWidget} call sites — adding a new
 * folder name here means the corresponding purpose also has to exist
 * on the owning backend service.
 */
function inferUploadPurpose(path: string): UploadPurpose | null {
  const p = path.toLowerCase();
  if (p.includes("business")) return "BUSINESS_LOGO";
  if (p.includes("location")) return "LOCATION_LOGO";
  if (p.includes("profile")) return "PROFILE_PICTURE";
  if (p.includes("product") && p.includes("collection")) return "PRODUCT_COLLECTION_IMAGE";
  if (p.includes("collection")) return "PRODUCT_COLLECTION_IMAGE";
  if (p.includes("product")) return "PRODUCT_IMAGE";
  if (p.includes("stock")) return "STOCK_IMAGE";
  if (p.includes("brand")) return "BRAND_LOGO";
  if (p.includes("categor")) return "CATEGORY_IMAGE";
  if (p.includes("department")) return "DEPARTMENT_IMAGE";
  if (p.includes("receipt")) return "RECEIPT_HEADER";
  return null;
}

export const getBuildInfo = () => {
  return {
    buildId: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "development",
    buildNumber:
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
        ? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF
        : "local",
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
  };
};
