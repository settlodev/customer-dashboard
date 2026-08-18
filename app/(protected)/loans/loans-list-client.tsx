"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  isLoanActive,
  isLoanClosed,
  type Loan,
  type LoanEligibility,
} from "@/types/loans/type";
import { EligibilityHero } from "@/components/loans/eligibility-hero";
import { LoanCard } from "@/components/loans/loan-card";

type Filter = "all" | "active" | "paid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paid", label: "Paid off" },
];

function Group({ label, count, loans }: { label: string; count: number; loans: Loan[] }) {
  if (loans.length === 0) return null;
  return (
    <div>
      <div className="mb-2.5 ml-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
        {label} · {count}
      </div>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {loans.map((l) => (
          <LoanCard key={l.id} loan={l} />
        ))}
      </div>
    </div>
  );
}

export function LoansListClient({
  eligibility,
  loans,
}: {
  eligibility: LoanEligibility;
  loans: Loan[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const activeLoan = useMemo(
    () => loans.find((l) => isLoanActive(l.status)) ?? null,
    [loans],
  );

  const { active, paid } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (l: Loan) =>
      !q ||
      l.reference.toLowerCase().includes(q) ||
      l.productName.toLowerCase().includes(q);
    const visible = loans.filter(match);
    return {
      active: visible.filter((l) => isLoanActive(l.status)),
      paid: visible.filter((l) => isLoanClosed(l.status)),
    };
  }, [loans, query]);

  const showActive = filter === "all" || filter === "active";
  const showPaid = filter === "all" || filter === "paid";
  const nothing =
    (!showActive || active.length === 0) && (!showPaid || paid.length === 0);

  return (
    <div className="space-y-6">
      <EligibilityHero eligibility={eligibility} activeLoan={activeLoan} />

      {/* Toolbar: segmented filter + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-line bg-card p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                filter === f.key
                  ? "bg-canvas text-ink"
                  : "text-muted-foreground hover:text-ink-2",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search loans…"
            className="w-40 bg-transparent text-[13px] text-ink placeholder:text-muted-2 focus:outline-none"
          />
        </div>
      </div>

      {nothing ? (
        <div className="rounded-xl border border-dashed border-line-2 bg-card py-16 text-center text-sm text-muted-foreground">
          No loans match.
        </div>
      ) : (
        <div className="space-y-6">
          {showActive && (
            <Group label="Active" count={active.length} loans={active} />
          )}
          {showPaid && <Group label="Paid off" count={paid.length} loans={paid} />}
        </div>
      )}
    </div>
  );
}
