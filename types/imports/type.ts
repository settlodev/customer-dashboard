/**
 * Shared types for the CSV import preview/commit flow. Keep in sync
 * with the Java enums in {@code co.tz.settlo.inventory.imports.domain}.
 */

export type ImportType =
  | "PRODUCT"
  | "STOCK"
  | "PRODUCT_WITH_STOCK"
  | "STOCK_WITH_PRODUCT"
  | "STOCK_INTAKE";

export type RowStatus =
  | "READY"
  | "EXACT_MATCH"
  | "SIMILAR_MATCH"
  | "MISSING_LOOKUP"
  | "INVALID_SCHEMA"
  | "DUPLICATE_IN_FILE"
  | "MATCHED"
  | "UNMATCHED"
  | "AMBIGUOUS_MATCH";

export type Decision = "SKIP" | "CREATE" | "UPDATE_EXISTING" | "APPLY_INTAKE";

export type ImportTargetType = "STOCK" | "STOCK_VARIANT" | "PRODUCT";

export interface SuggestedMatch {
  id: string;
  name: string;
  subtitle?: string | null;
  similarity?: number | null;
  targetType?: ImportTargetType | null;
}

export interface PreviewRow {
  rowIndex: number;
  groupKey: string | null;
  status: RowStatus;
  defaultDecision: Decision;
  parsed: Record<string, unknown>;
  suggestedMatches?: SuggestedMatch[] | null;
  errors?: string[] | null;
  warnings?: string[] | null;
}

export interface PreviewSummary {
  totalRows: number;
  ready: number;
  conflicts: number;
  errors: number;
  /** Rows whose name exactly matches an existing record. */
  existing: number;
  parentCount: number;
}

/**
 * One evaluated plan cap — present even when it fits, so the UI can warn on
 * "barely fits". Source of truth: {@code co.tz.settlo.inventory.imports.capacity.CapacityCheck}
 * — the `capacity` package, not the `imports.domain` package this file's
 * header points to.
 */
export interface CapacityCheck {
  limitKey: string;
  /** Merchant-facing noun, e.g. "products", "items held in stock". */
  noun: string;
  limit: number;
  currentUsage: number;
  headroom: number;
  requested: number;
  excess: number;
  exceeded: boolean;
}

/**
 * Capacity pre-flight verdict. Absent = not evaluated (older backend,
 * billing unreachable). Source of truth: {@code co.tz.settlo.inventory.imports.capacity.CapacityAssessment}
 * — the `capacity` package, not the `imports.domain` package this file's
 * header points to.
 */
export interface CapacityAssessment {
  /** true → the commit WILL be refused as-is. */
  blocked: boolean;
  /** Rendered multi-paragraph copy (blocks separated by \n\n); null unless blocked. */
  message: string | null;
  checks: CapacityCheck[];
}

export interface PreviewResponse {
  previewId: string;
  type: ImportType;
  expiresAt: string;
  summary: PreviewSummary;
  rows: PreviewRow[];
  capacity?: CapacityAssessment | null;
}

export interface RowDecision {
  rowIndex: number;
  action: Decision;
  targetId?: string | null;
  targetType?: ImportTargetType | null;
  overrides?: Record<string, unknown> | null;
}

export interface CommitRequest {
  previewId: string;
  decisions: RowDecision[];
}

export interface RowError {
  rowIndex: number;
  message: string;
}

export interface CommitResponse {
  created: number;
  updated: number;
  skipped: number;
  errors: RowError[];
  warnings: string[];
  /**
   * Set when a plan cap tripped partway through the batch (a race beat the
   * pre-flight): the counted rows are committed, the rest were not attempted.
   */
  stoppedBy?: string | null;
}
