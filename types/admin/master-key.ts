/**
 * The impersonation master key — the second factor on staff impersonation.
 *
 * Mirrors the Auth service's `MasterKeyResponse` from
 * `GET /auth/internal-admin/impersonation/master-key`.
 */
export interface MasterKeyResponse {
  /** Plaintext key, formatted `MK-XXXX-XXXX-XXXX-XXXX-XXXX`. */
  key: string;
  /** When this key stops being accepted. */
  expiresAt: string;
  /** When it was minted. */
  rotatedAt: string | null;
}

/**
 * One impersonatable staff identity matched by email.
 *
 * Mirrors Auth's `StaffImpersonationTarget` from
 * `GET /auth/internal-admin/impersonation/staff-targets`. The same person often
 * works for several merchants, so a lookup can return more than one — hence
 * `businessName` / `accountEmail`, which exist purely to tell them apart.
 */
export interface StaffImpersonationTarget {
  staffId: string;
  authId: string;
  accountId: string;
  businessName: string | null;
  accountEmail: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}
