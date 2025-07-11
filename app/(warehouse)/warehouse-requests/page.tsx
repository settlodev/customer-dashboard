

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/warehouse/requests/columns";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { searchWarehouseStockRequests } from "@/lib/actions/warehouse/request-actions";
import { StockRequests } from "@/types/warehouse/purchase/request/type";
import { BarChart, Clock, CheckCircle,Package } from "lucide-react";

const breadcrumbItems = [{ title: "Stock Requests", link: "/warehouse-requests" }];

// Summary data - you can replace this with actual calculations from your data
const getSummaryData = (data: StockRequests[]) => {
    const totalRequests = data.length;
    const pendingRequests = data.filter(req => req.warehouseRequestStatus === 'Pending').length;
    const approvedRequests = data.filter(req => req.warehouseRequestStatus === 'Approved').length;
    const completedRequests = data.filter(req => req.warehouseRequestStatus === 'Completed').length;
    
    // Calculate approval rate
    const approvalRate = totalRequests > 0 ? Math.round((approvedRequests + completedRequests) / totalRequests * 100) : 0;
    
    return [
        {
            title: "Total Requests",
            value: totalRequests.toString(),
            unit: "",
            change: "+5", // You can calculate this from historical data
            trend: "positive",
            icon: Package
        },
        {
            title: "Pending Requests",
            value: pendingRequests.toString(),
            unit: "",
            change: "-2",
            trend: "positive",
            icon: Clock
        },
        {
            title: "Approval Rate",
            value: approvalRate.toString(),
            unit: "%",
            change: "+3.2",
            trend: "positive",
            icon: CheckCircle
        }
    ];
};

type Params = { 
    searchParams: Promise<{ 
        search?: string; 
        page?: string; 
        limit?: string; 
    }> 
};

export default async function Page({ searchParams }: Params) {
    const resolvedSearchParams = await searchParams;
    
    const q = resolvedSearchParams.search || "";
    const page = Number(resolvedSearchParams.page) || 0;
    const pageLimit = Number(resolvedSearchParams.limit)

    const responseData = await searchWarehouseStockRequests(q, page, pageLimit);

    const data: StockRequests[] = responseData.content;
    const total = responseData.totalElements;
    const pageCount = responseData.totalPages;

    const summaryData = getSummaryData(data);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>
            </div>

            {/* Summary Analytics Card */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <BarChart size={20} />
                                Request Analytics
                            </CardTitle>
                            <CardDescription>
                                Overview of stock request performance
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {summaryData.map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                                <Card key={index} className="shadow-sm">
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <IconComponent size={20} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">{item.title}</p>
                                                    <p className="text-2xl font-bold mt-1">
                                                        {item.value}{item.unit}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded-full text-xs ${item.trend === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.change}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Data Table or No Data State */}
            {total > 0 || q !== "" ? (
                <Card x-chunk="data-table">
                    <CardHeader>
                        <CardTitle>Stock Requests</CardTitle>
                        <CardDescription>A list of all stock requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={data}
                            pageCount={pageCount}
                            pageNo={page}
                            searchKey=""
                            total={total}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                            <Package size={48} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Stock Requests Found
                        </h3>
                        <p className="text-gray-500 text-center max-w-md mb-6">
                            There are no stock requests available at the moment.
                        </p>
                       
                    </CardContent>
                </Card>
            )}
        </div>
    );
}