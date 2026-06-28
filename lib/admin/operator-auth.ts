import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission } from "@/lib/admin/permissions";

/**
 * Validates the current operator session and checks that it holds the required
 * internal permission. Returns the operator's userId (used as requesterId /
 * approverId — always derived server-side, never from a client argument).
 * Throws if the session is missing or the permission is absent.
 * Server-only — reads the operator session cookie.
 */
export async function requireOperatorPermission(permission: string): Promise<string> {
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
