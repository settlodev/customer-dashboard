import Loading from "@/components/ui/loading";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent, CardHeader} from "@/components/ui/card";
import DepartmentReportPage from "@/components/widgets/department-report";
import { departmentReport } from "@/lib/actions/department-actions";
import { Suspense } from "react";

const OrderReceipt = async ({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) => {
    // Await both params and searchParams since they're now Promises
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    
    const report = await departmentReport(
      resolvedParams.id,
      resolvedSearchParams.startDate,
      resolvedSearchParams.endDate
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