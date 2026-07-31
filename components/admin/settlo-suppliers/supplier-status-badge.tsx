import { cn } from "@/lib/utils";
import {
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_STATUS_TONES,
  type SettloSupplierVerificationStatus,
} from "@/types/admin/settlo-suppliers";

/**
 * SupplierStatusBadge — pill for a Settlo supplier's verification status.
 * Shared by the list table (Task 3) and the detail page header (Task 4).
 */
export function SupplierStatusBadge({
  status,
  className,
}: {
  status: SettloSupplierVerificationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12.5px] font-semibold",
        SUPPLIER_STATUS_TONES[status],
        className,
      )}
    >
      {SUPPLIER_STATUS_LABELS[status]}
    </span>
  );
}
