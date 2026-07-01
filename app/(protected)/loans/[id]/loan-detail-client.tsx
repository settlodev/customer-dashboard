"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CreditCard, Receipt, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProgressRing } from "@/components/loans/progress-ring";
import { RepaymentSchedule } from "@/components/loans/repayment-schedule";
import { MakePaymentDialog } from "@/components/loans/make-payment-dialog";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { LOAN_PERMISSIONS } from "@/lib/loans/permissions";
import { formatTzs, isLoanActive, type Loan } from "@/types/loans/type";

const medium = (d?: string | null) =>
  d
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(d))
    : "—";

function Fact({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "pos";
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[18px] font-bold tracking-tight ${tone === "pos" ? "text-pos" : "text-ink"}`}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-ink-3">{sub}</div>}
    </div>
  );
}

const AutoNote = ({ children }: { children: ReactNode }) => (
  <div className="flex gap-2.5 rounded-xl bg-canvas p-3 text-[12.5px] leading-relaxed text-ink-3">
    <Zap className="h-4 w-4 flex-shrink-0 text-ink-2" />
    <div>{children}</div>
  </div>
);

export function LoanDetailClient({
  loan,
  canApply,
  autoOpenPay,
}: {
  loan: Loan;
  canApply: boolean;
  autoOpenPay?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const active = isLoanActive(loan.status);
  const [payOpen, setPayOpen] = useState(!!autoOpenPay && active);

  const statement = () =>
    toast({
      title: "Statement",
      description: "Statement export is coming soon.",
    });

  const currency = loan.currencyCode;

  return (
    <div className="space-y-6">
      {/* Standing card */}
      <div className="rounded-xl border border-line bg-card p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          {/* Ring + headline facts */}
          <div className="flex items-center gap-5">
            <ProgressRing pct={loan.paidPct} label={active ? "Repaid" : "Repaid"} />
            <div className="space-y-3.5">
              {active ? (
                <>
                  <Fact label="Outstanding" value={formatTzs(loan.outstanding, currency)} />
                  <Fact
                    label="Repaid so far"
                    value={formatTzs(loan.repaidAmount, currency)}
                    tone="pos"
                  />
                </>
              ) : (
                <>
                  <Fact label="Principal" value={formatTzs(loan.principal, currency)} />
                  <Fact
                    label="Total repaid"
                    value={formatTzs(loan.totalRepayable, currency)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Middle facts */}
          <div className="flex flex-col justify-center gap-3.5 lg:border-l lg:border-line lg:pl-6">
            {active ? (
              <>
                <Fact
                  label="Next payment"
                  value={formatTzs(loan.nextPaymentAmount, currency)}
                  sub={`Due ${medium(loan.nextPaymentDate)}`}
                />
                <Fact
                  label="Payments made"
                  value={`${loan.paidInstallments} of ${loan.totalInstallments}`}
                />
              </>
            ) : (
              <>
                <Fact
                  label="Closed"
                  value={medium(loan.closedAt)}
                  sub="Paid in full"
                />
                <Fact
                  label="On-time"
                  value={`${loan.onTimeInstallments ?? loan.totalInstallments} of ${loan.totalInstallments}`}
                  tone="pos"
                />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 lg:min-w-[190px]">
            {active ? (
              <>
                <PermissionGuard permission={LOAN_PERMISSIONS.repay}>
                  <Button
                    className="justify-center"
                    onClick={() => setPayOpen(true)}
                  >
                    <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Make a payment
                  </Button>
                </PermissionGuard>
                <Button
                  variant="outline"
                  className="justify-center"
                  onClick={statement}
                >
                  <Receipt className="mr-1.5 h-3.5 w-3.5" /> Statement
                </Button>
                <AutoNote>
                  <b className="font-semibold text-ink-2">Auto-deduct on.</b> Pay
                  early anytime to finish sooner.
                </AutoNote>
              </>
            ) : (
              <>
                <PermissionGuard permission={LOAN_PERMISSIONS.apply}>
                  <Button
                    className="justify-center"
                    disabled={!canApply}
                    asChild={canApply}
                  >
                    {canApply ? (
                      <Link href="/loans/apply">
                        <Zap className="mr-1.5 h-3.5 w-3.5" /> Apply again
                      </Link>
                    ) : (
                      <span>
                        <Zap className="mr-1.5 h-3.5 w-3.5" /> Apply again
                      </span>
                    )}
                  </Button>
                </PermissionGuard>
                <Button
                  variant="outline"
                  className="justify-center"
                  onClick={statement}
                >
                  <Receipt className="mr-1.5 h-3.5 w-3.5" /> Download statement
                </Button>
                {!canApply && (
                  <AutoNote>
                    You have an active loan.{" "}
                    <b className="font-semibold text-ink-2">Clear it</b> to apply
                    again — one at a time.
                  </AutoNote>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">
              Repayment schedule
            </div>
            <div className="text-xs text-muted-foreground">
              {active
                ? `${loan.paidInstallments} of ${loan.totalInstallments} payments made · auto-deducted from sales`
                : `All ${loan.totalInstallments} payments completed`}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={statement}>
            <Receipt className="mr-1.5 h-3.5 w-3.5" /> Statement
          </Button>
        </div>
        {loan.schedule && loan.schedule.length > 0 ? (
          <RepaymentSchedule schedule={loan.schedule} currencyCode={currency} />
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No schedule available.
          </div>
        )}
      </div>

      {active && (
        <PermissionGuard permission={LOAN_PERMISSIONS.repay}>
          <MakePaymentDialog
            loan={loan}
            open={payOpen}
            onOpenChange={setPayOpen}
            onRecorded={() => router.refresh()}
          />
        </PermissionGuard>
      )}
    </div>
  );
}
