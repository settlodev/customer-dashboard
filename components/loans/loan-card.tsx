import Link from "next/link";

import { formatTzs, isLoanClosed, type Loan } from "@/types/loans/type";
import { PRODUCT_ICONS } from "@/components/loans/product-icon";
import { LoanStatusBadge } from "@/components/loans/loan-status-badge";

const shortDate = (d?: string | null) =>
  d
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(d),
      )
    : "—";

export function LoanCard({ loan }: { loan: Loan }) {
  const Icon = PRODUCT_ICONS[loan.productKey];
  const done = isLoanClosed(loan.status);

  return (
    <Link
      href={`/loans/${loan.id}`}
      className="block rounded-xl border border-line bg-card p-[18px] transition-all hover:border-line-2 hover:shadow-[0_4px_14px_-6px_rgba(20,17,12,0.12)]"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-[11px] border border-line bg-canvas text-ink-2">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold tracking-tight text-ink">
            {loan.productName}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {loan.reference} · {loan.termMonths} months
          </div>
        </div>
        <LoanStatusBadge status={loan.status} />
      </div>

      <div className="mt-4 text-[20px] font-bold tracking-tight text-ink">
        {formatTzs(done ? loan.principal : loan.outstanding, loan.currencyCode)}
        <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
          {done ? "repaid in full" : "outstanding"}
        </span>
      </div>

      <div className="mt-3.5 h-[7px] overflow-hidden rounded-full bg-canvas">
        <div
          className={`h-full rounded-full ${done ? "bg-muted-2" : "bg-pos"}`}
          style={{ width: `${loan.paidPct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {done
            ? `Closed ${shortDate(loan.closedAt)}`
            : `${loan.paidInstallments} of ${loan.totalInstallments} payments`}
        </span>
        <span className="font-semibold text-ink-2">
          {done ? "On time" : `Next ${shortDate(loan.nextPaymentDate)}`}
        </span>
      </div>
    </Link>
  );
}
