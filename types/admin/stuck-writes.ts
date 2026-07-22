/**
 * Types for the system-admin Stuck Writes console. Mirrors the OMS
 * dead-letter and repair-command DTOs returned by the internal-secret-gated
 * endpoints under `/api/v1/admin/dead-letters*`.
 */

/** The four verbs the repair command can carry. */
export type RepairVerb =
  | "RESYNC"
  | "FORCE_DRAIN"
  | "RETRY_MUTATION"
  | "DISCARD_MUTATION";

/** Lifecycle of a repair command on the server. */
export type RepairCommandStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "DISPATCHED";

/** One dead-lettered mutation row from OMS `client_sync_dead_letters`. */
export interface DeadLetterRow {
  /** Row UUID. */
  id: string;
  /** Stable key used to target RETRY_MUTATION / DISCARD_MUTATION. */
  idempotencyKey: string | null;
  /** Mutation op type, e.g. "CREATE_ORDER", "ADD_ITEMS". */
  opType: string;
  /**
   * The target resource id (e.g. orderId). Used as the `order` filter param
   * on the list endpoint and enriched with `orderNumber` when it resolves.
   */
  resourceId: string | null;
  /** Human order number populated by the OMS when resourceId is a known order. */
  orderNumber: string | null;
  deviceId: string;
  staffId: string | null;
  /** NOT NULL on the OMS column — always present. */
  locationId: string;
  businessId: string | null;
  /**
   * Dead-letter classification: "terminal" | "conflict" | "validation" |
   * "stale" | "network" | "server" (open string server-side).
   */
  classification: string;
  /** True when the mutation touches real money (used for the four-eyes gate). */
  isMoneyOp: boolean;
  /** Total delivery attempts before dead-lettering. */
  attempts: number;
  /** Last server error message or drainer error classification detail. */
  lastError: string | null;
  /** JSON string blob of the original mutation payload. */
  payload: string | null;
  /** ISO timestamp when this mutation was originally enqueued offline. */
  offlineCreatedAt: string | null;
  /** ISO timestamp when this row was written to the dead-letter sink. */
  deadLetteredAt: string;
  /** ISO timestamp when the row was resolved; null while still stuck. */
  resolvedAt: string | null;
  /** "DRAINED" | "SOFT_DROPPED" | "DISCARDED"; null while unresolved. */
  resolution: string | null;
  /** "SERVER_REPLAY" | "SERVER_OBSERVED" | "DEVICE_REPORTED" | "OPERATOR_COMMAND". */
  resolutionSource: string | null;
  /** Free-text detail: the op that landed, the discard reason, etc. */
  resolutionDetail: string | null;
  /** Operator id when a human initiated the resolution. */
  resolvedBy: string | null;
  /** Failed server-replay attempts recorded against this row. */
  retryCount: number;
  /** ISO timestamp of the most recent failed retry; null if never retried. */
  lastRetryAt: string | null;
}

/** Paginated OMS response for `GET /api/v1/admin/dead-letters`. */
export interface DeadLetterPage {
  content: DeadLetterRow[];
  totalElements: number;
  totalPages: number;
  /** Zero-based page index. */
  page: number;
  size: number;
}

/** Query params for listing dead letters (0-indexed page). */
export interface ListDeadLettersParams {
  page?: number;
  size?: number;
  deviceId?: string;
  /** Filter by resource_id (e.g. orderId). Maps to the OMS `order` query param. */
  order?: string;
  locationId?: string;
  classification?: string;
  /** When true, restrict to is_money_op = true; false = non-money only. */
  moneyOp?: boolean;
  /** ISO date-time lower bound on dead_lettered_at. */
  from?: string;
  /** ISO date-time upper bound on dead_lettered_at (exclusive). */
  to?: string;
  /** true → resolved archive; omitted/false → still-stuck rows (the default view). */
  resolved?: boolean;
}

/** Request body for `POST /api/v1/admin/dead-letters/repair`. */
export interface CreateRepairCommandBody {
  locationId: string;
  businessId: string | null;
  deviceId: string;
  verb: RepairVerb;
  /** Required for RETRY_MUTATION and DISCARD_MUTATION. */
  idempotencyKey?: string;
  /** The operator's userId (from the staff JWT). */
  requesterId: string;
  reason?: string;
}

/** Body for approve / reject endpoints. */
export interface ApproveRejectBody {
  approverId: string;
}

/** One repair-command audit row returned by OMS. */
export interface RepairCommandRow {
  commandId: string;
  deviceId: string;
  locationId: string | null;
  businessId: string | null;
  verb: RepairVerb;
  idempotencyKey: string | null;
  isMoneyOp: boolean;
  requesterId: string;
  approverId: string | null;
  reason: string | null;
  status: RepairCommandStatus;
  /** ISO timestamp when the command was created / requested. */
  requestedAt: string;
  /** ISO timestamp when the command was approved or rejected (null while REQUESTED). */
  decidedAt?: string;
  /** ISO timestamp when the command was dispatched to the device (null until DISPATCHED). */
  dispatchedAt?: string;
  /** ISO timestamp when the device acked the command (null until acked). */
  ackedAt?: string;
  /** The device's ack result, e.g. "APPLIED" | "NOOP" | "FAILED". */
  result?: string | null;
}

/** Paginated OMS response for `GET /api/v1/admin/dead-letters/repair`. */
export interface RepairCommandPage {
  content: RepairCommandRow[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/** Params for listing repair commands. */
export interface ListRepairCommandsParams {
  status?: RepairCommandStatus;
  page?: number;
  size?: number;
}

/** Outcome of a server-side replay retry. A FAILED replay is still an HTTP 200. */
export type DeadLetterRetryOutcome = "DRAINED" | "FAILED";

/** Synchronous result of `POST …/dead-letters/{id}/retry`. */
export interface DeadLetterRetryResponse {
  outcome: DeadLetterRetryOutcome;
  /** Whether THIS call resolved the row (false if another signal already did). */
  resolved: boolean;
  retryCount: number;
  errorCode: string | null;
  errorMessage: string | null;
}

/** One entry on the merged diagnostic timeline. */
export interface DeadLetterContextEntry {
  /** ISO timestamp; may be null (server sorts these last). */
  at: string | null;
  /** "SERVER" (order event) or "DEVICE" (client-activity row). */
  source: string;
  type: string;
  description: string | null;
  detail: string | null;
}

/** Merged server+device diagnostic bundle for one dead letter. */
export interface DeadLetterContextResponse {
  deadLetterId: string;
  orderId: string | null;
  orderNumber: string | null;
  orderStatus: string | null;
  /** False when the order was never on the server — itself part of the answer. */
  orderFound: boolean;
  timeline: DeadLetterContextEntry[];
}
