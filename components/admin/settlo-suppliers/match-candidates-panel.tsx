import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/admin/shared/section-card";
import {
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_STATUS_TONES,
  type SettloSupplierVerificationStatus,
} from "@/types/admin/settlo-suppliers";
import type { MatchCandidate } from "@/types/supplier/nomination";

interface MatchCandidatesPanelProps {
  candidates: MatchCandidate[];
  canManage: boolean;
  /** Called with the chosen directory entry's id when staff match instead of creating. */
  onMatch: (settloSupplierId: string) => void;
  /** Disables every "Match to this" button while a decision is in flight. */
  isPending?: boolean;
}

// `verificationStatus` arrives pre-stringified from the backend with no
// compile-time enum guarantee (see types/supplier/nomination.ts) — fall back
// to the raw string instead of throwing on an unrecognised value.
function candidateStatusLabel(status: string): string {
  return (
    SUPPLIER_STATUS_LABELS[status as SettloSupplierVerificationStatus] ??
    status
  );
}

function candidateStatusTone(status: string): string {
  return (
    SUPPLIER_STATUS_TONES[status as SettloSupplierVerificationStatus] ??
    "bg-muted text-muted-foreground"
  );
}

/**
 * MatchCandidatesPanel — directory entries that might be the same
 * real-world supplier as the nomination being reviewed, so staff can match
 * instead of minting a duplicate. Purely presentational: the mutation
 * (`approveNomination(id, { mode: "MATCH", settloSupplierId })`) plus its
 * pending/toast/refresh handling lives in the parent
 * `NominationDecisionClient`, passed down as `onMatch`.
 */
export function MatchCandidatesPanel({
  candidates,
  canManage,
  onMatch,
  isPending,
}: MatchCandidatesPanelProps) {
  return (
    <SectionCard
      title="Similar suppliers in the directory"
      subtitle="Match instead of creating a duplicate entry."
    >
      {candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No similar suppliers found.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {candidates.map((candidate) => (
            <li
              key={candidate.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink">
                    {candidate.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      candidateStatusTone(candidate.verificationStatus),
                    )}
                  >
                    {candidateStatusLabel(candidate.verificationStatus)}
                  </span>
                  {candidate.financingEligible && (
                    <span className="text-[11px] font-medium text-pos">
                      Financing eligible
                    </span>
                  )}
                </div>
                {candidate.matchedOn.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {candidate.matchedOn.map((reason, idx) => (
                      <Badge key={`${candidate.id}-${idx}-${reason}`} variant="soft">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {canManage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => onMatch(candidate.id)}
                >
                  Match to this
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
