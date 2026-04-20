import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { SerialSearch } from "@/components/widgets/traceability/serial-search";
import { BatchRecall } from "@/components/widgets/traceability/batch-recall";

const breadcrumbItems = [{ title: "Traceability", link: "/traceability" }];

export default function TraceabilityPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4">
      <div>
        <BreadcrumbsNav items={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-bold">Traceability</h1>
        <p className="text-sm text-muted-foreground">
          Find a specific serial number or issue a batch-wide recall.
        </p>
      </div>

      <SerialSearch />
      <BatchRecall />
    </div>
  );
}
