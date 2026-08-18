/**
 * Supplier nomination — a merchant submits one of their own `Supplier`
 * records for staff review to join the Settlo-approved directory
 * (`SettloSupplier`). Staff triage the queue and resolve each nomination by
 * either creating a new directory entry or matching an existing one; the
 * merchant's supplier is then linked back automatically.
 *
 * Two response shapes mirror the Inventory Service's DTOs 1:1 (do not rename
 * fields):
 *  - `SupplierNomination` — merchant-facing, `/api/v1/supplier-nominations`.
 *  - `NominationReview` — staff-facing, `/api/v1/settlo-supplier-nominations`,
 *    a superset adding ownership/audit fields and match candidates.
 *
 * Every field below is always present on the wire (the backend DTOs carry no
 * `@JsonInclude(NON_NULL)`) — an empty value is `null`, never an omitted key.
 */

export type NominationStatus =
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

export type NominationResolution = "CREATED" | "MATCHED";

export const NOMINATION_STATUS_LABELS: Record<NominationStatus, string> = {
  SUBMITTED: "Under review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  WITHDRAWN: "Withdrawn",
};

// Tones follow the semantic badge tokens used in components/admin/shared/onboarding-badge.tsx
export const NOMINATION_STATUS_TONES: Record<NominationStatus, string> = {
  SUBMITTED: "bg-warn-tint text-warn",
  APPROVED: "bg-pos-tint text-pos",
  REJECTED: "bg-neg-tint text-neg",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

/**
 * Merchant-facing nomination — `GET/POST /api/v1/supplier-nominations`. The
 * contact/registration fields are a server-side snapshot of the source
 * `Supplier` taken at submit time (never client-settable, and not re-synced
 * if the supplier record changes afterwards).
 */
export interface SupplierNomination {
  id: string;
  sourceSupplierId: string;
  status: NominationStatus;
  resolution: NominationResolution | null;
  settloSupplierId: string | null;
  note: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  contactPersonEmail: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  registrationNumber: string | null;
  tinNumber: string | null;
}

/**
 * A directory entry that might be the same real-world supplier as a
 * nomination, surfaced by the staff detail endpoint so a reviewer can match
 * instead of creating a duplicate. `verificationStatus` mirrors
 * `SettloSupplierVerificationStatus` but arrives pre-stringified from the
 * backend (no compile-time enum guarantee on this field). `matchedOn` is a
 * list of free-text reason labels (e.g. "TIN", "Phone", "Similar name"), not
 * a closed enum either — render defensively.
 */
export interface MatchCandidate {
  id: string;
  name: string;
  verificationStatus: string;
  financingEligible: boolean;
  matchedOn: string[];
}

/**
 * Staff-facing nomination — `GET /api/v1/settlo-supplier-nominations`. Adds
 * ownership/audit fields plus match candidates on top of the base
 * `SupplierNomination` shape.
 *
 * `matchCandidates` and `sourceSupplierDeleted` only carry real values on the
 * single-nomination `GET /{id}` response — the list/approve/reject responses
 * hardcode `[]` / `false` regardless of actual state.
 */
export interface NominationReview extends SupplierNomination {
  businessId: string;
  submittedByUserId: string | null;
  sourceSupplierDeleted: boolean;
  matchCandidates: MatchCandidate[];
}
