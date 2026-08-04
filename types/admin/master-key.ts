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
