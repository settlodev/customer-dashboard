import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import RfqForm from "@/components/forms/rfq-form";
import { getLocationConfig } from "@/lib/actions/location-config-actions";

export default async function NewRfqPage() {
  const config = await getLocationConfig();
  if (!config?.rfqEnabled) notFound();

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Requests for Quotation", href: "/rfqs" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="New Request for Quotation"
        subtitle="Solicit quotes from multiple suppliers, compare prices and lead times side-by-side, then award a single winner."
      />
      <PageBody>
        <RfqForm />
      </PageBody>
    </PageShell>
  );
}
