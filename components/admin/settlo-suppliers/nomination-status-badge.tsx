import { cn } from "@/lib/utils";
import {
  NOMINATION_STATUS_LABELS,
  NOMINATION_STATUS_TONES,
  type NominationStatus,
} from "@/types/supplier/nomination";

/**
 * NominationStatusBadge — pill for a supplier nomination's review status.
 * Mirrors `SupplierStatusBadge`'s shape; shared by the review queue table
 * (Task 3 list) and the nomination detail page header (Task 3 detail).
 */
export function NominationStatusBadge({
  status,
  className,
}: {
  status: NominationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12.5px] font-semibold",
        NOMINATION_STATUS_TONES[status],
        className,
      )}
    >
      {NOMINATION_STATUS_LABELS[status]}
    </span>
  );
}
