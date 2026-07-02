import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import DataLoadError from "@/components/layouts/data-load-error";
import { softFetch } from "@/lib/list-fallback";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { ensureLoanAccess } from "@/lib/loans/access";
import { getLoanEligibility, listLoans } from "@/lib/actions/loans-actions";

import { LoansListClient } from "./loans-list-client";

export default async function LoansPage() {
  if (!LOANS_ENABLED) notFound();
  await ensureLoanAccess();

  const [eligibility, loans] = await Promise.all([
    softFetch(getLoanEligibility()),
    softFetch(listLoans()),
  ]);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Financing" }, { title: "Loans" }]}
      />
      <PageHeader
        title="Loans"
        subtitle="Your financing across all products."
      />
      <PageBody>
        {!eligibility || !loans ? (
          <DataLoadError itemName="loans" />
        ) : (
          <LoansListClient eligibility={eligibility} loans={loans} />
        )}
      </PageBody>
    </PageShell>
  );
}
