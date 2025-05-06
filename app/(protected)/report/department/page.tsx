'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimeRange, DateTimeRangeSelect } from "@/components/widgets/date-range-select";
import { DepartmentReport, fectchAllDepartments } from "@/lib/actions/department-actions";
import { Department} from "@/types/department/type";
import { UUID } from "crypto";
import { CalendarDays, DollarSign, Package as PackageIcon, Percent, ShoppingCart, TrendingDown, TrendingUp, User } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

// Define the TopItems interface based on the sample response
interface TopItems {
  name: string;
  productName: string;
  variantName: string;
  categoryName: string;
  imageUrl: string | null;
  quantity: number;
  price: number;
  cost: number;
  grossProfit: number;
  latestSoldDate: string;
  earliestSoldDate: string;
  revenue?: number;
  percentageOfTotal?: number;
  staffName?: string;
  averagePrice?: number;
}

// Extended Report interface to include soldItems
interface ExtendedReport {
  totalGrossProfit: number;
  totalNetAmount: number;
  totalGrossAmount: number;
  soldItems: {
    name: string;
    productName: string;
    variantName: string;
    categoryName: string;
    imageUrl: string | null;
    quantity: number;
    price: number;
    cost: number;
    grossProfit: number;
    latestSoldDate: string;
    earliestSoldDate: string;
    revenue?: number;
    percentageOfTotal?: number;
    staffName?: string;
    averagePrice?: number;
  }[];
  startDate: string;
  endDate: string;
  name: string;
  totalSales: number;
  totalItems: number;
  totalOrders: number;
  totalCustomers: number;
  totalDiscounts: number;
  totalTaxes: number;
  totalShipping: number;
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function DepartmentReportPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null|undefined>(null);
  const [report, setReport] = useState<ExtendedReport | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Set default values - from: today at 00:00, to: current time
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const [dateRange, setDateRange] = useState<DateTimeRange>({
    from: startOfDay,
    to: today,
  });

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const data = await fectchAllDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    }
    fetchDepartments();
  }, []);

  const handleDateRangeChange = (newDateRange: DateTimeRange | undefined) => {
    if (newDateRange) {
      setDateRange(newDateRange);
    }
  };

  const fetchReport = async () => {
    if (!selectedDepartment || !dateRange.from || !dateRange.to) return;
    setLoading(true);

    const id = selectedDepartment?.id as unknown as UUID;
    try {
      const data = await DepartmentReport(
        id,
        dateRange.from.toISOString(),
        dateRange.to.toISOString()
      );
      // Transform Report data into ExtendedReport format
      const extendedReport: ExtendedReport = {
        totalGrossProfit: data.totalGrossProfit,
        totalNetAmount: data.totalNetAmount,
        totalGrossAmount: data.totalGrossAmount,
        soldItems: [], // Initialize as empty array
        startDate: data.startDate,
        endDate: data.endDate,
        name: data.name,
        totalSales: data.totalGrossAmount || 0,
        totalItems: data.totalItemsSold || 0,
        totalOrders: 0, // These fields are not in the Report type
        totalCustomers: 0,
        totalDiscounts: 0,
        totalTaxes: 0,
        totalShipping: 0
      };

      // Transform soldItems to match the new structure
      if (data.soldItems && Array.isArray(data.soldItems)) {
        extendedReport.soldItems = data.soldItems.map(item => {
          const revenue = (item.price || 0) * (item.quantity || 0);
          const percentageOfTotal = (revenue / extendedReport.totalGrossAmount) * 100;
          
          return {
            ...item,
            revenue,
            percentageOfTotal,
            averagePrice: item.price || 0,
            staffName: "Staff" // Default value as it's not in your sample data
          };
        });
      }
      setReport(extendedReport);
    } catch (error) {
      console.error("Failed to fetch report", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="w-full mt-16">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Select value={selectedDepartment?.id} onValueChange={(value) => setSelectedDepartment(departments.find(dept => dept.id === value))}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Select a Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
           
            <div className="flex flex-col lg:flex-row items-center space-x-2 space-y-2 lg:space-y-0">
              <DateTimeRangeSelect 
                dateRange={dateRange} 
                onDateRangeChange={handleDateRangeChange}
              />
              <Button 
                onClick={fetchReport}
                disabled={!dateRange?.from || !dateRange?.to || loading}
                className="w-full lg:w-auto"
              >
                {loading ? "Loading..." : "Filter"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 p-6">
          {report && (
            <>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items Sold</p>
                    <p className="text-xl font-semibold">{report.totalItems.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gross Amount</p>
                    <p className="text-xl font-semibold">{formatCurrency(report.totalGrossAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Net Amount</p>
                    <p className="text-xl font-semibold">{formatCurrency(report.totalNetAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {report.totalGrossProfit < 0 ? (
                    <>
                      <TrendingDown className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Gross Loss</p>
                        <p className="text-xl font-semibold">{formatCurrency(Math.abs(report.totalGrossProfit))}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Gross Profit</p>
                        <p className="text-xl font-semibold">{formatCurrency(report.totalGrossProfit)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Products Section */}
      {report && report.soldItems && report.soldItems.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center">
              <PackageIcon className="mr-2 h-5 w-5 text-teal-600" />
              Items Sold
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 divide-y">
                {report.soldItems.map((item: TopItems, index: number) => (
                  <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 min-w-16 bg-slate-200 rounded-md flex items-center justify-center">
                            {!item.imageUrl && (
                              <PackageIcon className="h-8 w-8 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{item.productName}</h3>
                            <p className="text-sm text-slate-500">{item.variantName}</p>
                            <div className="flex items-center mt-1">
                              <p className="bg-slate-100 text-slate-700 hover:bg-slate-100 p-1">{item.categoryName}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 md:mt-0">
                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <DollarSign className="h-4 w-4 text-emerald-500 mb-1" />
                          <p className="text-xs text-slate-500">Revenue</p>
                          <p className="font-semibold">{formatCurrency(item.revenue || item.price * item.quantity)}</p>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <PackageIcon className="h-4 w-4 text-blue-500 mb-1" />
                          <p className="text-xs text-slate-500">Quantity</p>
                          <p className="font-semibold">{item.quantity} units</p>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <Percent className="h-4 w-4 text-purple-500 mb-1" />
                          <p className="text-xs text-slate-500">% of Total</p>
                          <p className="font-semibold">{item.percentageOfTotal?.toFixed(1) || ((item.price * item.quantity) / report.totalGrossAmount * 100).toFixed(1)}%</p>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <CalendarDays className="h-4 w-4 text-amber-500 mb-1" />
                          <p className="text-xs text-slate-500">Latest Sold</p>
                          <p className="font-semibold text-xs">{format(new Date(item.latestSoldDate), "dd MMM HH:mm")}</p>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <CalendarDays className="h-4 w-4 text-amber-500 mb-1" />
                          <p className="text-xs text-slate-500">Earliest Sold</p>
                          <p className="font-semibold text-xs">{format(new Date(item.earliestSoldDate), "dd MMM HH:mm")}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>Sold by: {item.staffName || "Staff"}</span>
                      </div>
                      <div>Avg. price: {formatCurrency(item.averagePrice || item.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {report && (!report.soldItems || report.soldItems.length === 0) && (
        <Card className="shadow-md mt-6">
          <CardContent className="p-6 text-center">
            <PackageIcon className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-medium">No items sold in this date range</p>
            <p className="text-sm text-slate-500 mt-2">Try selecting a different date range or department</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}