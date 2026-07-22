"use server";

import { requireOperatorPermission } from "@/lib/admin/operator-auth";
import { PERM } from "@/lib/admin/permissions";
import { omsInternalGet, omsInternalPost } from "@/lib/oms-internal-client";
import { parseStringify } from "@/lib/utils";
import type {
  ApproveRejectBody,
  CreateRepairCommandBody,
  DeadLetterContextResponse,
  DeadLetterPage,
  DeadLetterRetryResponse,
  ListDeadLettersParams,
  ListRepairCommandsParams,
  RepairCommandPage,
  RepairCommandRow,
} from "@/types/admin/stuck-writes";
import type { FormResponse } from "@/types/types";

/**
 * Browse the OMS dead-letter sink. Hits `GET /api/v1/admin/dead-letters`
 * via the internal-secret-gated OMS client. Page is 0-indexed.
 * Requires: internal:activity:read
 */
export async function listDeadLetters(
  params: ListDeadLettersParams = {},
): Promise<DeadLetterPage> {
  await requireOperatorPermission(PERM.ACTIVITY_LOG_READ);
  const query: Record<string, string | number | undefined> = {
    page: Math.max(0, params.page ?? 0),
    size: Math.min(200, Math.max(1, params.size ?? 20)),
    deviceId: params.deviceId || undefined,
    order: params.order || undefined,
    locationId: params.locationId || undefined,
    classification: params.classification || undefined,
    moneyOp:
      params.moneyOp === true
        ? "true"
        : params.moneyOp === false
          ? "false"
          : undefined,
    from: params.from || undefined,
    to: params.to || undefined,
    resolved:
      params.resolved === true
        ? "true"
        : params.resolved === false
          ? "false"
          : undefined,
  };
  const data = await omsInternalGet<DeadLetterPage>(
    "/api/v1/admin/dead-letters",
    query,
  );
  return parseStringify(data);
}

/**
 * Create a repair command. Safe verbs and non-money discards are dispatched
 * immediately (status DISPATCHED). Money-op discards land as REQUESTED and
 * await approval.
 * Requires: internal:repair:execute
 * requesterId is ALWAYS set from the operator session — never from the client body.
 */
export async function createRepairCommand(
  body: Omit<CreateRepairCommandBody, "requesterId">,
): Promise<RepairCommandRow> {
  const operatorId = await requireOperatorPermission(PERM.REPAIR_EXECUTE);
  if (body.verb === "DISCARD_MUTATION" && (!body.reason || !body.reason.trim())) {
    throw new Error("A reason is required when discarding a mutation.");
  }
  const payload: CreateRepairCommandBody = {
    ...body,
    requesterId: operatorId,
  };
  const data = await omsInternalPost<RepairCommandRow>(
    "/api/v1/admin/dead-letters/repair",
    payload,
  );
  return parseStringify(data);
}

/**
 * Approve a pending money-op discard. Server enforces approverId != requesterId.
 * Requires: internal:repair:approve
 * approverId is ALWAYS derived from the operator session — never from a client argument.
 */
export async function approveRepairCommand(
  commandId: string,
): Promise<RepairCommandRow> {
  const operatorId = await requireOperatorPermission(PERM.REPAIR_APPROVE);
  const body: ApproveRejectBody = { approverId: operatorId };
  const data = await omsInternalPost<RepairCommandRow>(
    `/api/v1/admin/dead-letters/repair/${commandId}/approve`,
    body,
  );
  return parseStringify(data);
}

/**
 * Reject a pending money-op discard.
 * Requires: internal:repair:approve
 * approverId is ALWAYS derived from the operator session — never from a client argument.
 */
export async function rejectRepairCommand(
  commandId: string,
): Promise<RepairCommandRow> {
  const operatorId = await requireOperatorPermission(PERM.REPAIR_APPROVE);
  const body: ApproveRejectBody = { approverId: operatorId };
  const data = await omsInternalPost<RepairCommandRow>(
    `/api/v1/admin/dead-letters/repair/${commandId}/reject`,
    body,
  );
  return parseStringify(data);
}

/**
 * Approvals inbox — lists repair commands by status (default: REQUESTED).
 * Requires: internal:activity:read
 */
export async function listPendingApprovals(
  params: ListRepairCommandsParams = {},
): Promise<RepairCommandPage> {
  await requireOperatorPermission(PERM.ACTIVITY_LOG_READ);
  const query: Record<string, string | number | undefined> = {
    status: params.status ?? "REQUESTED",
    page: Math.max(0, params.page ?? 0),
    size: Math.min(100, Math.max(1, params.size ?? 20)),
  };
  const data = await omsInternalGet<RepairCommandPage>(
    "/api/v1/admin/dead-letters/repair",
    query,
  );
  return parseStringify(data);
}

/**
 * Repair-command history, filtered by a single status (OMS filters one at a
 * time — there is no "all"). Defaults to DISPATCHED, the post-action view that
 * carries dispatchedAt / ackedAt / result.
 * Requires: internal:activity:read
 */
export async function listRepairCommands(
  params: ListRepairCommandsParams = {},
): Promise<RepairCommandPage> {
  await requireOperatorPermission(PERM.ACTIVITY_LOG_READ);
  const query: Record<string, string | number | undefined> = {
    status: params.status ?? "DISPATCHED",
    page: Math.max(0, params.page ?? 0),
    size: Math.min(100, Math.max(1, params.size ?? 20)),
  };
  const data = await omsInternalGet<RepairCommandPage>(
    "/api/v1/admin/dead-letters/repair",
    query,
  );
  return parseStringify(data);
}

/**
 * Server-side replay of a dead letter's stored payload. Returns the real
 * outcome synchronously. Only valid for non-money, non-stale rows (the caller
 * gates on that); money/stale rows use the RETRY_MUTATION device command.
 *
 * requesterId is stamped from the operator session, never the client.
 * Requires: internal:repair:execute
 */
export async function retryDeadLetter(
  id: string,
): Promise<FormResponse<DeadLetterRetryResponse>> {
  const operatorId = await requireOperatorPermission(PERM.REPAIR_EXECUTE);
  try {
    const data = await omsInternalPost<DeadLetterRetryResponse>(
      `/api/v1/admin/dead-letters/${id}/retry`,
      undefined,
      { requesterId: operatorId },
    );
    if (data.outcome === "DRAINED") {
      return parseStringify({
        responseType: "success",
        message: "Replayed — the write landed on the server.",
        data,
      });
    }
    // outcome === "FAILED": the replay ran and was rejected (e.g. ITEM_REMOVED).
    return parseStringify({
      responseType: "error",
      message: data.errorMessage ?? "The replay was rejected by the server.",
      errorCode: data.errorCode ?? undefined,
      data,
    });
  } catch (err) {
    // HTTP-level failures: 409 RETRY_IN_PROGRESS / ALREADY_RESOLVED /
    // RETRY_NOT_REPLAYABLE, 400 RETRY_NO_ACTOR / OP_NOT_REPLAYABLE, 404.
    // omsInternalPost surfaces the OMS `message` field, which is operator-readable.
    return parseStringify({
      responseType: "error",
      message:
        err instanceof Error
          ? err.message
          : "The retry could not be dispatched.",
    });
  }
}

/**
 * Merged server-events + device-activity timeline for one dead letter, for the
 * details dialog. Best-effort: any failure returns null so the dialog degrades
 * to a "timeline unavailable" state rather than throwing.
 * Requires: internal:activity:read
 */
export async function getDeadLetterContext(
  id: string,
): Promise<DeadLetterContextResponse | null> {
  try {
    await requireOperatorPermission(PERM.ACTIVITY_LOG_READ);
    const data = await omsInternalGet<DeadLetterContextResponse>(
      `/api/v1/admin/dead-letters/${id}/context`,
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}
