import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import RfqForm from "@/components/forms/rfq-form";
import { getLocationConfig } from "@/lib/actions/location-config-actions";

const breadcrumbItems = [
  { title: "Requests for Quotation", link: "/rfqs" },
  { title: "New", link: "" },
];

export default async function NewRfqPage() {
  const config = await getLocationConfig();
  if (!config?.rfqEnabled) notFound();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl font-bold">New Request for Quotation</h1>
        <p className="text-sm text-muted-foreground">
          Solicit quotes from multiple suppliers, compare prices and lead
          times side-by-side, then award a single winner.
        </p>
      </div>
      <RfqForm />
    </div>
  );
}
