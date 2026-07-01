import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageShell,
} from "@/components/layouts/page-shell";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { ensureLoanAccess } from "@/lib/loans/access";
import { LOAN_PERMISSIONS } from "@/lib/loans/permissions";
import { getLoanEligibility } from "@/lib/actions/loans-actions";

import { LoanApplyClient } from "./loan-apply-client";

export default async function LoanApplyPage() {
  if (!LOANS_ENABLED) notFound();
  await ensureLoanAccess(LOAN_PERMISSIONS.apply);

  const eligibility = await getLoanEligibility();

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Financing" },
          { title: "Loans", href: "/loans" },
          { title: "Apply" },
        ]}
      />
      <PageBody>
        <LoanApplyClient eligibility={eligibility} />
      </PageBody>
    </PageShell>
  );
}
