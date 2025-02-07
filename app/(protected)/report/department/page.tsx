'use client';
import { useState, useEffect } from "react";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShoppingCart, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { DepartmentReport, fectchAllDepartments } from "@/lib/actions/department-actions";
import { UUID } from "crypto";
import { Department, Report } from "@/types/department/type";
import { DateRange } from "react-day-picker";
import { DateRangeSelect } from "@/components/widgets/date-range-select";

export default function DepartmentReportPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null|undefined>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange >({
    from: new Date(),
    to: new Date(),
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

  const handleDateRangeChange = (newDateRange: DateRange ) => {
    setDateRange(newDateRange);
  };

  const fetchReport = async () => {
    if (!selectedDepartment || !dateRange.from || !dateRange.to) return;
    setLoading(true);

    const id = selectedDepartment?.id as unknown as UUID;
    // console.log("The id is: ", id);
    try {
      const data = await DepartmentReport(
        id,
        dateRange.from.toISOString(),
        dateRange.to.toISOString()
      );
    //   console.log("The report is: ", data);
      setReport(data);
    } catch (error) {
      console.error("Failed to fetch report", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="w-full">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Select value={selectedDepartment?.id} onValueChange={(value) => setSelectedDepartment(departments.find(dept => dept.id === value))}>
                <SelectTrigger className="w-[200px]">
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
            <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <DateRangeSelect 
                dateRange={dateRange} 
                onDateRangeChange={(newDateRange) => handleDateRangeChange(newDateRange ?? { from: undefined, to: undefined })}
              />
              <Button 
                onClick={fetchReport}
                disabled={!dateRange?.from || !dateRange?.to || loading}
              >
                {loading ? "Loading..." : "Filter"}
              </Button>
            </div>
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
                    <p className="text-xl font-semibold">{report.totalItemsSold.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gross Amount</p>
                    <p className="text-xl font-semibold">{report.totalGrossAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Net Amount</p>
                    <p className="text-xl font-semibold">{report.totalNetAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {report.totalGrossProfit < 0 ? (
                    <>
                      <TrendingDown className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Gross Loss</p>
                        <p className="text-xl font-semibold">{Math.abs(report.totalGrossProfit).toLocaleString()}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Gross Profit</p>
                        <p className="text-xl font-semibold">{report.totalGrossProfit.toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
