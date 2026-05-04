import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Vendors" }]} />
      <PageHeader
        title="Vendors"
        subtitle="Service and software vendors you pay outside the supplier flow."
      />
      <PageBody>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Construction className="mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
              Coming soon
            </h3>
            <p className="max-w-md text-xs text-muted-foreground">
              Vendor records and payments are on the way. Until then, manage suppliers under Procurement.
            </p>
          </CardContent>
        </Card>
      </PageBody>
    </PageShell>
  );
}
