/**
 * Public shape of the upload module. Keep this in sync with the
 * backend {@code UploadPurpose} enums across services — adding a new
 * purpose here is half the work; the owning service has to grow a
 * matching enum value with its path template and limits.
 */

export type UploadPurpose =
  | "BUSINESS_LOGO"
  | "LOCATION_LOGO"
  | "PROFILE_PICTURE"
  | "PRODUCT_IMAGE"
  | "STOCK_IMAGE"
  | "BRAND_LOGO"
  | "CATEGORY_IMAGE"
  | "DEPARTMENT_IMAGE"
  | "PRODUCT_COLLECTION_IMAGE"
  | "RECEIPT_HEADER"
  | "INVENTORY_ATTACHMENT"
  | "EXPENSE_ATTACHMENT";

export interface UploadPresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  method: string;
  requiredHeaders: Record<string, string>;
  expiresIn: number;
  expiresAt: string;
}

export interface UploadOptions {
  file: File;
  purpose: UploadPurpose;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult {
  url: string;
  key: string;
  contentType: string;
  size: number;
  filename: string;
}
