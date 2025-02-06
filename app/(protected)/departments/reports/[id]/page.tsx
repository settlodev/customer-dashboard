import Loading from "@/app/(protected)/loading";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DepartmentReportPage from "@/components/widgets/department-report";
import { DepartmentReport } from "@/lib/actions/department-actions";
import { UUID } from "crypto";
import { Suspense } from "react";

const OrderReceipt = async ({ 
  params,
  searchParams 
}: { 
  params: { id: string };
  searchParams: { startDate?: string; endDate?: string };
}) => {
    const report = await DepartmentReport(
      params.id as UUID,
      searchParams.startDate,
      searchParams.endDate
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="mb-6">
                    <BreadcrumbsNav items={[{ title: "Reports", link: `/departments` }, { title: report?.name, link: `/departments/reports/${report?.name}` }]} />
                </div>
                <Suspense fallback={<div>
                    <Loading/>
                </div>}>
                   <Card>
                    <CardHeader>
                        <p className="text-2xl">Department Report</p>
                    </CardHeader>
                    <CardContent>
                    <DepartmentReportPage report={report} />
                    </CardContent>
                   </Card>
                </Suspense>
            </div>
        </div>
    );
};

export default OrderReceipt;
