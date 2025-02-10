'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Building2, Calendar, ShoppingCart, TrendingUp, DollarSign, TrendingDown } from 'lucide-react';
import { Report } from '@/types/department/type';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { DateRangeSelect } from './date-range-select';
import { Button } from '../ui/button';

const DepartmentReportPage: React.FC<{ report: Report }> = ({ report }) => {
  console.log(report);
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: parseISO(report.startDate),
    to: parseISO(report.endDate),
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  const handleFilter = () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setIsLoading(true);
    const searchParams = new URLSearchParams();
    searchParams.set('startDate', dateRange.from.toISOString());
    searchParams.set('endDate', dateRange.to.toISOString());
    
    router.push(`?${searchParams.toString()}`);
  };
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="w-full">
      <CardHeader className="border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Building2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">{report.name}</CardTitle>
                <p className="text-muted-foreground flex items-center space-x-2 mt-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(parseISO(report.startDate), 'PPP')} - {format(parseISO(report.endDate), 'PPP')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DateRangeSelect 
                dateRange={dateRange} 
                onDateRangeChange={handleDateRangeChange}
              />
              <Button 
                onClick={handleFilter}
                disabled={!dateRange?.from || !dateRange?.to || isLoading}
              >
                {isLoading ? "Loading..." : "Filter"}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="grid md:grid-cols-2 gap-4 p-6">
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
                <p className="text-xl font-semibold">
                  {report.totalGrossAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Net Amount</p>
                <p className="text-xl font-semibold">
                  {report.totalNetAmount.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              {report.totalGrossProfit < 0 ? (
                <>
                  <TrendingDown className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Loss</p>
                    <p className="text-xl font-semibold">
                      {Math.abs(report.totalGrossProfit).toLocaleString()} {/* Display absolute value */}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gross Profit</p>
                    <p className="text-xl font-semibold">
                      {report.totalGrossProfit.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentReportPage;