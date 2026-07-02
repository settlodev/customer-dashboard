// Server-side Loans permission gating.
//
// Source of truth is the SAME as the layout's nav gating: the server-resolved
// `GET /api/v1/permissions/me` (getMyPermissions). The JWT `permissions` string
// claim is being phased out of minted tokens, so reading it directly gates out
// everyone (incl. owners) once it's dropped — it's only a transient fallback
// here. The real enforcement is the backend @PreAuthorize once the financing
// service exists; these guards stop a limited-scope member from reaching the
// routes directly while the module is stub-backed.

import { notFound } from "next/navigation";

import { getAuthToken } from "@/lib/auth-utils";
import { extractPermissions } from "@/lib/jwt-utils";
import { getMyPermissionsCached } from "@/lib/permissions/me";
import { LOAN_PERMISSIONS } from "@/lib/loans/permissions";

async function loanPerms(): Promise<string[]> {
  const live = await getMyPermissionsCached();
  if (live) return live;
  // Fallback: the legacy JWT permissions claim (may be empty as it's retired).
  const token = await getAuthToken();
  return token?.accessToken ? extractPermissions(token.accessToken) : [];
}

export interface LoanAccess {
  canRead: boolean;
  canApply: boolean;
  canRepay: boolean;
}

export const NO_LOAN_ACCESS: LoanAccess = {
  canRead: false,
  canApply: false,
  canRepay: false,
};

/** Resolve the caller's loans capabilities — for conditionally rendering the hero / CTAs. */
export async function getLoanAccess(): Promise<LoanAccess> {
  const perms = await loanPerms();
  return {
    canRead: perms.includes(LOAN_PERMISSIONS.read),
    canApply: perms.includes(LOAN_PERMISSIONS.apply),
    canRepay: perms.includes(LOAN_PERMISSIONS.repay),
  };
}

/** Route guard: 404 the page unless the caller holds `required` (defaults to loans:read). */
export async function ensureLoanAccess(
  required: string = LOAN_PERMISSIONS.read,
): Promise<void> {
  const perms = await loanPerms();
  if (!perms.includes(required)) notFound();
}
