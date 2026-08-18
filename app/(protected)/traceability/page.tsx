import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { SerialSearch } from "@/components/widgets/traceability/serial-search";
import { BatchLookup } from "@/components/widgets/traceability/batch-lookup";
import { BatchRecall } from "@/components/widgets/traceability/batch-recall";
import { SupplierRecall } from "@/components/widgets/traceability/supplier-recall";

export default function TraceabilityPage() {
  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Traceability" }]} />
      <PageHeader
        title="Traceability"
        subtitle="Look up a serial or batch, or issue a recall across the business."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/traceability/recalls">
              <FileText className="mr-1.5 h-4 w-4" />
              Recall register
            </Link>
          </Button>
        }
      />
      <PageBody>
        <SerialSearch />
        <BatchLookup />
        <BatchRecall />
        <SupplierRecall />
      </PageBody>
    </PageShell>
  );
}
