import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { SerialSearch } from "@/components/widgets/traceability/serial-search";
import { BatchLookup } from "@/components/widgets/traceability/batch-lookup";
import { BatchRecall } from "@/components/widgets/traceability/batch-recall";
import { SupplierRecall } from "@/components/widgets/traceability/supplier-recall";

const breadcrumbItems = [{ title: "Traceability", link: "/traceability" }];

export default function TraceabilityPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex items-start justify-between">
        <div>
          <BreadcrumbsNav items={breadcrumbItems} />
          <h1 className="mt-2 text-2xl font-bold">Traceability</h1>
          <p className="text-sm text-muted-foreground">
            Look up a serial or batch, or issue a recall across the business.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/traceability/recalls">
            <FileText className="h-4 w-4 mr-2" />
            Recall register
          </Link>
        </Button>
      </div>

      <SerialSearch />
      <BatchLookup />
      <BatchRecall />
      <SupplierRecall />
    </div>
  );
}
