import Loading from "@/components/ui/loading";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DepartmentReportPage from "@/components/widgets/department-report";
import { departmentReport } from "@/lib/actions/department-actions";
import { Suspense } from "react";

const OrderReceipt = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const report = await departmentReport(
    resolvedParams.id,
    resolvedSearchParams.startDate,
    resolvedSearchParams.endDate,
  );

  return (
    <PageShell maxWidth="wide">
      <PageBreadcrumbs
        items={[
          { title: "Departments", href: "/departments" },
          { title: "Reports", href: "/departments" },
          { title: report?.name ?? "Report" },
        ]}
      />
      <PageHeader title="Department Report" subtitle={report?.name} />

      <PageBody>
        <Suspense
          fallback={
            <div>
              <Loading />
            </div>
          }
        >
          <Card>
            <CardHeader>
              <p className="text-2xl">Department Report</p>
            </CardHeader>
            <CardContent>
              <DepartmentReportPage report={report} />
            </CardContent>
          </Card>
        </Suspense>
      </PageBody>
    </PageShell>
  );
};

export default OrderReceipt;