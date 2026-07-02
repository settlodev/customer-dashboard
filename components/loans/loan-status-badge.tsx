import { cn } from "@/lib/utils";
import {
  LOAN_STATUS_LABELS,
  LOAN_STATUS_TONES,
  type LoanStatus,
} from "@/types/loans/type";

export function LoanStatusBadge({
  status,
  className,
}: {
  status: LoanStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        LOAN_STATUS_TONES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LOAN_STATUS_LABELS[status]}
    </span>
  );
}
