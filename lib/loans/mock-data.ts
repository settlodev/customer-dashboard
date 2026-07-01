/**
 * ⚠️ TEMPORARY mock data source for the Loans module.
 *
 * The financing backend does not exist yet. `lib/actions/loans-actions.ts`
 * reads from here so the full UI can be built and reviewed end-to-end. When
 * the real service ships, delete this file and swap each action's mock read
 * for the `apiClient.<verb>(loansUrl(...))` call sketched alongside it.
 *
 * Everything here is derived from a few seed specs so the numbers stay
 * internally consistent (fee, total, installments, schedule and progress all
 * reconcile).
 */

import { addMonths, format, parseISO, subDays } from "date-fns";

import {
  LOAN_PRODUCTS,
  feeLabelFor,
  isLoanActive,
  loanProgressPct,
  type Loan,
  type LoanEligibility,
  type LoanProductKey,
  type LoanStatus,
  type RepaymentScheduleItem,
} from "@/types/loans/type";

const CURRENCY = "TZS";

interface LoanSeed {
  id: string;
  reference: string;
  productKey: LoanProductKey;
  principal: number;
  termMonths: number;
  paidInstallments: number;
  status: Extract<LoanStatus, "ACTIVE" | "PAID">;
  startedAt: string; // yyyy-MM-dd
  channel: Loan["disbursementChannel"];
  accountMask: string;
}

const SEEDS: LoanSeed[] = [
  {
    id: "ln_004821",
    reference: "LN-004821",
    productKey: "WORKING_CAPITAL",
    principal: 3_000_000,
    termMonths: 12,
    paidInstallments: 5,
    status: "ACTIVE",
    startedAt: "2026-02-15",
    channel: "MPESA",
    accountMask: "··· 8317",
  },
  {
    id: "ln_004655",
    reference: "LN-004655",
    productKey: "STOCK_LOAN",
    principal: 1_500_000,
    termMonths: 4,
    paidInstallments: 4,
    status: "PAID",
    startedAt: "2025-11-03",
    channel: "MPESA",
    accountMask: "··· 8317",
  },
  {
    id: "ln_003910",
    reference: "LN-003910",
    productKey: "DEVICE_FINANCING",
    principal: 450_000,
    termMonths: 6,
    paidInstallments: 6,
    status: "PAID",
    startedAt: "2025-08-01",
    channel: "MPESA",
    accountMask: "··· 8317",
  },
  {
    id: "ln_003204",
    reference: "LN-003204",
    productKey: "WORKING_CAPITAL",
    principal: 2_000_000,
    termMonths: 9,
    paidInstallments: 9,
    status: "PAID",
    startedAt: "2025-01-10",
    channel: "BANK",
    accountMask: "··· 1190",
  },
];

function buildLoan(seed: LoanSeed): Loan {
  const product = LOAN_PRODUCTS[seed.productKey];
  const facilityFee = Math.round(
    product.feeType === "FLAT"
      ? seed.principal * product.feeRate
      : seed.principal * product.feeRate * seed.termMonths,
  );
  const totalRepayable = seed.principal + facilityFee;
  const installmentAmount = Math.round(totalRepayable / seed.termMonths);

  const start = parseISO(seed.startedAt);
  const schedule: RepaymentScheduleItem[] = Array.from(
    { length: seed.termMonths },
    (_, i) => {
      const number = i + 1;
      const dueDate = format(addMonths(start, number), "yyyy-MM-dd");
      // Last installment absorbs the rounding remainder so the schedule sums
      // exactly to the total repayable.
      const amount =
        number === seed.termMonths
          ? totalRepayable - installmentAmount * (seed.termMonths - 1)
          : installmentAmount;
      let state: RepaymentScheduleItem["state"];
      let paidOn: string | null = null;
      if (i < seed.paidInstallments) {
        state = "PAID";
        paidOn = format(subDays(addMonths(start, number), 1), "yyyy-MM-dd");
      } else if (i === seed.paidInstallments && seed.status === "ACTIVE") {
        state = "DUE";
      } else {
        state = "UPCOMING";
      }
      return { number, dueDate, amount, state, paidOn };
    },
  );

  const repaidAmount =
    seed.paidInstallments >= seed.termMonths
      ? totalRepayable
      : installmentAmount * seed.paidInstallments;
  const outstanding = Math.max(0, totalRepayable - repaidAmount);

  const nextItem =
    seed.status === "ACTIVE"
      ? schedule.find((s) => s.state === "DUE" || s.state === "UPCOMING")
      : undefined;

  const closedAt =
    seed.status === "PAID" ? schedule[schedule.length - 1].dueDate : null;

  return {
    id: seed.id,
    reference: seed.reference,
    productKey: seed.productKey,
    productName: product.name,
    status: seed.status,
    currencyCode: CURRENCY,
    principal: seed.principal,
    facilityFee,
    feeLabel: feeLabelFor(product),
    totalRepayable,
    outstanding,
    repaidAmount,
    termMonths: seed.termMonths,
    installmentAmount,
    paidInstallments: seed.paidInstallments,
    totalInstallments: seed.termMonths,
    onTimeInstallments: seed.paidInstallments,
    nextPaymentDate: nextItem?.dueDate ?? null,
    nextPaymentAmount: nextItem?.amount ?? null,
    startedAt: seed.startedAt,
    closedAt,
    disbursementChannel: seed.channel,
    disbursementAccountMask: seed.accountMask,
    autoDeduct: true,
    schedule,
    paidPct: loanProgressPct({ totalRepayable, repaidAmount }),
  };
}

// Flip to `true` to seed an in-progress facility. That re-enables the active
// loan detail + make-payment demo and switches the dashboard / list hero to
// the "repaying" state. With `false` there is no active loan, so the hero
// shows the "available to borrow / Apply" state.
const SEED_ACTIVE_LOAN = false;

const ALL_LOANS: Loan[] = SEEDS.filter(
  (s) => SEED_ACTIVE_LOAN || s.status !== "ACTIVE",
).map(buildLoan);

const ELIGIBILITY_LIMIT = 6_500_000;

/** Detail fetch — includes the repayment schedule. */
export function getMockLoan(id: string): Loan | null {
  return ALL_LOANS.find((l) => l.id === id || l.reference === id) ?? null;
}

/** List fetch — mirrors a backend list view. */
export function getMockLoans(): Loan[] {
  return ALL_LOANS;
}

export function getMockEligibility(): LoanEligibility {
  const hasActive = ALL_LOANS.some((l) => isLoanActive(l.status));
  const active = ALL_LOANS.find((l) => isLoanActive(l.status));
  return {
    currencyCode: CURRENCY,
    limit: ELIGIBILITY_LIMIT,
    available: hasActive ? 0 : ELIGIBILITY_LIMIT,
    onTimeRatePct: 100,
    loansRepaid: ALL_LOANS.filter((l) => l.status === "PAID").length,
    customerSince: "2024",
    hasActiveLoan: hasActive,
    activeLoanId: active?.id ?? null,
  };
}
