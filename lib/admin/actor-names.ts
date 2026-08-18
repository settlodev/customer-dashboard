import type { InternalUserResponse } from "@/types/admin/internal-user";
import type { InternalStaffSummary } from "@/types/admin/internal-staff";

/**
 * Resolve internal-staff actor UUIDs (audit `userId`, package `createdBy`,
 * etc.) to a human label for admin screens.
 *
 * The actor id is the staff member's **Auth user id** — that's what the
 * dashboard sends as `X-User-Id` (from `token.userId`) and what the services
 * store on audit rows. It joins to `InternalUserResponse.id` (Auth) and to
 * `InternalStaffSummary.authUserId` (Accounts HRM profile). We prefer the
 * profile's full name, fall back to the Auth email.
 */
export function buildActorNameMap(
  users: InternalUserResponse[],
  profiles: InternalStaffSummary[],
): Record<string, string> {
  const map: Record<string, string> = {};
  // Base layer: Auth email keyed by Auth user id.
  for (const u of users) {
    if (u?.id && u.email) map[u.id] = u.email;
  }
  // Overlay: Accounts profile full name wins over the email (nicer label).
  for (const p of profiles) {
    if (!p?.authUserId) continue;
    const name =
      p.fullName?.trim() ||
      `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() ||
      p.email ||
      "";
    if (name) map[p.authUserId] = name;
  }
  return map;
}

/**
 * Display label for an actor id. `null`/empty id → "System" (a change with no
 * recorded actor, e.g. a seeded package). A non-empty id not in the directory
 * (deleted staff, external agent) → "Unknown user".
 */
export function resolveActorName(
  id: string | null | undefined,
  actorNames: Record<string, string>,
): string {
  if (!id) return "System";
  return actorNames[id] ?? "Unknown user";
}
