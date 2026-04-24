// Mirrors the backend `AttachmentResponse` in the Inventory Service plus the
// whitelisted entity types from AttachmentService.ALLOWED_ENTITY_TYPES.

export type AttachmentEntityType =
  | "GRN"
  | "LPO"
  | "STOCK_MODIFICATION"
  | "STOCK_TRANSFER"
  | "SUPPLIER_RETURN"
  | "OPENING_STOCK"
  | "STOCK_TAKE"
  | "PRODUCT"
  | "BATCH_RECALL";

export interface Attachment {
  id: string;
  entityType: AttachmentEntityType;
  entityId: string;
  fileName: string;
  originalFileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  /** Public URL when R2 storage is enabled; otherwise a relative download path. */
  url: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

export const ATTACHMENT_ENTITY_LABELS: Record<AttachmentEntityType, string> = {
  GRN: "Goods Received Note",
  LPO: "Local Purchase Order",
  STOCK_MODIFICATION: "Stock Modification",
  STOCK_TRANSFER: "Stock Transfer",
  SUPPLIER_RETURN: "Supplier Return",
  OPENING_STOCK: "Opening Stock",
  STOCK_TAKE: "Stock Take",
  PRODUCT: "Product",
  BATCH_RECALL: "Batch Recall",
};

/** 10 MB — must stay in sync with AttachmentService.MAX_FILE_SIZE. */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
