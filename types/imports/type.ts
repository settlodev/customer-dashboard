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

export interface SuggestedMatch {
  id: string;
  name: string;
  subtitle?: string | null;
  similarity?: number | null;
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

export interface PreviewResponse {
  previewId: string;
  type: ImportType;
  expiresAt: string;
  summary: PreviewSummary;
  rows: PreviewRow[];
}

export interface RowDecision {
  rowIndex: number;
  action: Decision;
  targetId?: string | null;
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
}
