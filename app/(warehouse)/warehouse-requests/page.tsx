

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
import { stockRequestReportForWarehouse } from "@/lib/actions/warehouse/request-actions"; // Add this import
import { StockRequests } from "@/types/warehouse/purchase/request/type";
import { StockRequestReport } from "@/types/warehouse/purchase/request/type"; // Add this import
import { BarChart, Clock, CheckCircle, Package, XCircle } from "lucide-react";

const breadcrumbItems = [{ title: "Stock Requests", link: "/warehouse-requests" }];

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

    // Fetch both the data and the report
    const [responseData, reportData] = await Promise.all([
        searchWarehouseStockRequests(q, page, pageLimit),
        stockRequestReportForWarehouse()
    ]);

    const data: StockRequests[] = responseData.content;
    const total = responseData.totalElements;
    const pageCount = responseData.totalPages;
    const report: StockRequestReport | null = reportData;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>
            </div>

            {/* Summary Report Cards */}
            {report && (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Requests
                            </CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{report.totalStockRequests}</div>
                            <p className="text-xs text-muted-foreground">
                                All stock requests
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Approved
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{report.approvedStockRequests}</div>
                            <p className="text-xs text-muted-foreground">
                                {report.totalStockRequests > 0 
                                    ? `${Math.round((report.approvedStockRequests / report.totalStockRequests) * 100)}% of total`
                                    : "0% of total"
                                }
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Received
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{report.receivedStockRequests}</div>
                            <p className="text-xs text-muted-foreground">
                                {report.totalStockRequests > 0 
                                    ? `${Math.round((report.receivedStockRequests / report.totalStockRequests) * 100)}% of total`
                                    : "0% of total"
                                }
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pending
                            </CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{report.pendingStockRequests}</div>
                            <p className="text-xs text-muted-foreground">
                                {report.totalStockRequests > 0 
                                    ? `${Math.round((report.pendingStockRequests / report.totalStockRequests) * 100)}% of total`
                                    : "0% of total"
                                }
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Cancelled
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{report.cancelledStockRequests}</div>
                            <p className="text-xs text-muted-foreground">
                                {report.totalStockRequests > 0 
                                    ? `${Math.round((report.cancelledStockRequests / report.totalStockRequests) * 100)}% of total`
                                    : "0% of total"
                                }
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

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
                            searchKey="warehouseStockVariantName"
                            total={total}
                            filterKey="requestStatus"
                            filterOptions={[
                            { label: "All", value: "" },
                            { label: "Pending", value: "PENDING" },
                            { label: "Approved", value: "APPROVED" },
                            { label: "Received", value: "RECEIVED" },
                            { label: "Cancelled", value: "CANCELLED" },
                            ]}
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