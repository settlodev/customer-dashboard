"use server";

import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { omsInternalGet, omsInternalPost } from "@/lib/oms-internal-client";
import { parseStringify } from "@/lib/utils";
import type {
  ApproveRejectBody,
  CreateRepairCommandBody,
  DeadLetterPage,
  ListDeadLettersParams,
  ListRepairCommandsParams,
  RepairCommandPage,
  RepairCommandRow,
} from "@/types/admin/stuck-writes";

/**
 * Validates the current operator session and checks that it holds the required
 * internal permission. Returns the operator's userId (used as requesterId /
 * approverId — always derived server-side, never from a client argument).
 * Throws if the session is missing or the permission is absent.
 */
async function requireOperatorPermission(permission: string): Promise<string> {
  const staff = await getStaffAuthToken();
  if (!staff?.accessToken) {
    throw new Error("Operator session has expired. Sign in again to continue.");
  }
  if (!hasInternalPermission(staff, permission)) {
    throw new Error(
      `You do not have permission to perform this action (requires ${permission}).`,
    );
  }
  return staff.userId;
}

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
