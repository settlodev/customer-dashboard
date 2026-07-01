import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { ensureLoanAccess } from "@/lib/loans/access";
import { getLoan, getLoanEligibility } from "@/lib/actions/loans-actions";
import { LoanStatusBadge } from "@/components/loans/loan-status-badge";
import { formatTzs } from "@/types/loans/type";

import { LoanDetailClient } from "./loan-detail-client";

type Params = Promise<{ id: string }>;
type Search = Promise<{ pay?: string }>;

const medium = (d?: string | null) =>
  d
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(d))
    : "—";

export default async function LoanDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  if (!LOANS_ENABLED) notFound();
  await ensureLoanAccess();

  const { id } = await params;
  const { pay } = await searchParams;

  const loan = await getLoan(id);
  if (!loan) notFound();

  const eligibility = await getLoanEligibility();

  const subtitle = `${loan.productName} · ${formatTzs(loan.principal, loan.currencyCode)} principal · started ${medium(loan.startedAt)}${
    loan.closedAt ? ` · closed ${medium(loan.closedAt)}` : ""
  }`;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Financing" },
          { title: "Loans", href: "/loans" },
          { title: loan.reference },
        ]}
      />
      <PageHeader
        title={loan.reference}
        subtitle={subtitle}
        titleAccessory={<LoanStatusBadge status={loan.status} />}
      />
      <PageBody>
        <LoanDetailClient
          loan={loan}
          canApply={!eligibility.hasActiveLoan}
          autoOpenPay={pay === "1"}
        />
      </PageBody>
    </PageShell>
  );
}
