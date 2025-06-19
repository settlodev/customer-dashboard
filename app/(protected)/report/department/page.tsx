'use client'
import { useState,useEffect } from "react";
import { format } from "date-fns";
import { 
  CalendarDays, 
  CalendarIcon, 
  DollarSign, 
  Package as PackageIcon, 
  Percent, 
  ShoppingCart, 
  TrendingDown, 
  TrendingUp, 
  User 
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { toast } from "@/hooks/use-toast";
import SubmitButton from '@/components/widgets/submit-button';
import { cn } from "@/lib/utils";


import { DepartmentReport, fectchAllDepartments } from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";
import { UUID } from "crypto";


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

interface ExtendedReport {
  totalGrossProfit: number;
  totalNetAmount: number;
  totalGrossAmount: number;
  soldItems: TopItems[];
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

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

interface FormValues {
  startDate: Date;
  endDate: Date;
}

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function DepartmentReportPage() {
  // State management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [report, setReport] = useState<ExtendedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({
    startDate: (() => {
      const now = new Date();
      now.setHours(0, 0, 0, 1);
      return now;
    })(),
    endDate: new Date()
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState<{
    startDate?: string;
    endDate?: string;
    general?: string;
  }>({});

  // Fetch departments on component mount
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const data = await fectchAllDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to fetch departments", error);
        toast({
          variant: "destructive",
          title: "Failed to load departments",
          description: "Please try refreshing the page",
        });
      }
    }
    fetchDepartments();
  }, []);

  // Date/time picker component
  const DateTimePicker = ({ value, onChange, label }: DatePickerProps) => {
    function handleDateSelect(date: Date | undefined) {
      if (date) {
        const newDate = new Date(date);
        newDate.setHours(value.getHours());
        newDate.setMinutes(value.getMinutes());
        onChange(newDate);
      }
    }

    function handleTimeChange(type: "hour" | "minute", val: string) {
      const newDate = new Date(value);
      if (type === "hour") {
        newDate.setHours(parseInt(val, 10));
      } else if (type === "minute") {
        newDate.setMinutes(parseInt(val, 10));
      }
      onChange(newDate);
    }

    return (
      <div className="flex flex-col space-y-2">
        <span className="text-sm font-medium">{label}</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
              aria-label={`Select ${label.toLowerCase()}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "MM/dd/yyyy HH:mm") : <span>Pick date and time</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="sm:flex">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleDateSelect}
                initialFocus
              />
              <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex sm:flex-col p-2">
                    {Array.from({ length: 24 }, (_, i) => i)
                      .reverse()
                      .map((hour) => (
                        <Button
                          key={hour}
                          size="icon"
                          variant={value && value.getHours() === hour ? "default" : "ghost"}
                          className="sm:w-full shrink-0 aspect-square"
                          onClick={() => handleTimeChange("hour", hour.toString())}
                        >
                          {hour}
                        </Button>
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex sm:flex-col p-2">
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                      <Button
                        key={minute}
                        size="icon"
                        variant={value && value.getMinutes() === minute ? "default" : "ghost"}
                        className="sm:w-full shrink-0 aspect-square"
                        onClick={() => handleTimeChange("minute", minute.toString())}
                      >
                        {minute.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // Handle date changes
  const handleDateChange = (field: keyof FormValues, value: Date) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear any related errors
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: {
      startDate?: string;
      endDate?: string;
      general?: string;
    } = {};

    if (!formValues.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!formValues.endDate) {
      errors.endDate = "End date is required";
    }

    if (formValues.startDate && formValues.endDate && formValues.startDate > formValues.endDate) {
      errors.general = "Start date must be before end date";
    }

    if (!selectedDepartment) {
      errors.general = "Please select a department";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!selectedDepartment) return;
    
    setLoading(true);
    const id = selectedDepartment?.id as unknown as UUID;
    try {
      const data = await DepartmentReport(id, formValues.startDate.toISOString(), formValues.endDate.toISOString());
      
      
      // Transform Report data into ExtendedReport format
      const extendedReport: ExtendedReport = {
        totalGrossProfit: data.totalGrossProfit,
        totalNetAmount: data.totalNetAmount,
        totalGrossAmount: data.totalGrossAmount,
        soldItems: [], 
        startDate: data.startDate,
        endDate: data.endDate,
        name: data.name,
        totalSales: data.totalGrossAmount || 0,
        totalItems: data.totalItemsSold || 0,
        totalOrders: 0, 
        totalCustomers: 0,
        totalDiscounts: 0,
        totalTaxes: 0,
        totalShipping: 0
      };

      // Transform soldItems to match the new structure
      if (data.soldItems && Array.isArray(data.soldItems)) {
        extendedReport.soldItems = data.soldItems.map(item => {
          const revenue = (item.price || 0) * (item.quantity || 0);
          const percentageOfTotal = extendedReport.totalGrossAmount > 0 
            ? (revenue / extendedReport.totalGrossAmount) * 100
            : 0;

          return {
            ...item,
            revenue,
            percentageOfTotal,
            averagePrice: item.quantity > 0 ? revenue / item.quantity : item.price || 0,
            staffName: "Staff"
          };
          });
        }
        
        setReport(extendedReport);
      } catch (error) {
      console.error("Error fetching department report:", error);
      toast({
        variant: "destructive",
        title: "Error loading report",
        description: "There was a problem fetching the report data. Please try again.",
      });
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
              <Select 
                value={selectedDepartment?.id} 
                onValueChange={(value) => {
                  setSelectedDepartment(departments.find(dept => dept.id === value) || null);
                  
                  if (formErrors.general) {
                    setFormErrors(prev => ({ ...prev, general: undefined }));
                  }
                }}
              >
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

            <div className="w-full md:w-auto">
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3">
                  <div className="flex flex-col w-full md:w-auto">
                    <DateTimePicker
                      value={formValues.startDate}
                      onChange={(date) => handleDateChange('startDate', date)}
                      label="Start Date"
                    />
                    {formErrors.startDate && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.startDate}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col w-full md:w-auto">
                    <DateTimePicker
                      value={formValues.endDate}
                      onChange={(date) => handleDateChange('endDate', date)}
                      label="End Date"
                    />
                    {formErrors.endDate && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.endDate}</p>
                    )}
                  </div>
                  
                  <div className="w-full md:w-auto">
                    <SubmitButton
                      isPending={loading}
                      label="Filter"
                      margin={6}
                      className="w-full md:w-auto"
                      
                    />
                  </div>
                </div>
                {formErrors.general && (
                  <p className="text-xs text-red-500 mt-2">{formErrors.general}</p>
                )}
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 p-6">
          {report && (
            <>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items Sold</p>
                    <p className="text-xl font-semibold">{report.totalItems.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gross Amount</p>
                    <p className="text-xl font-semibold">{formatCurrency(report.totalGrossAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Net Amount</p>
                    <p className="text-xl font-semibold">{formatCurrency(report.totalNetAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {report.totalGrossProfit < 0 ? (
                    <>
                      <TrendingDown className="w-6 h-6 text-red-600" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-muted-foreground">Gross Loss</p>
                        <p className="text-xl font-semibold">{formatCurrency(Math.abs(report.totalGrossProfit))}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-6 h-6 text-emerald-600" aria-hidden="true" />
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

      {/* Loading State */}
      {loading && (
        <Card className="shadow-md mt-6">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="mt-4 text-lg font-medium">Loading report data...</p>
          </CardContent>
        </Card>
      )}

      {/* Products Section */}
      {!loading && report && report.soldItems && report.soldItems.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center">
              <PackageIcon className="mr-2 h-5 w-5 text-teal-600" aria-hidden="true" />
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
                              <PackageIcon className="h-8 w-8 text-slate-400" aria-hidden="true" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{item.productName}</h3>
                            <p className="text-sm text-slate-500">{item.variantName}</p>
                            <div className="flex items-center mt-1">
                              <p className="bg-slate-100 text-slate-700 p-1 rounded">{item.categoryName}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 md:mt-0">
                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <DollarSign className="h-4 w-4 text-emerald-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">Price</p>
                          <p className="font-semibold">{formatCurrency(item.price)}</p>
                        </div>

                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <PackageIcon className="h-4 w-4 text-blue-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">Quantity</p>
                          <p className="font-semibold">{item.quantity} units</p>
                        </div>

                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <Percent className="h-4 w-4 text-purple-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">% of Total</p>
                          <p className="font-semibold">{item.percentageOfTotal?.toFixed(1) || ((item.price * item.quantity) / report.totalGrossAmount * 100).toFixed(1)}%</p>
                        </div>

                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <CalendarDays className="h-4 w-4 text-amber-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">Latest Sold</p>
                          <p className="font-semibold text-xs">{format(new Date(item.latestSoldDate), "dd MMM HH:mm")}</p>
                        </div>

                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <CalendarDays className="h-4 w-4 text-amber-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">Earliest Sold</p>
                          <p className="font-semibold text-xs">{format(new Date(item.earliestSoldDate), "dd MMM HH:mm")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" aria-hidden="true" />
                        <span>Sold by: {item.staffName || "Staff"}</span>
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Items State */}
      {!loading && report && (!report.soldItems || report.soldItems.length === 0) && (
        <Card className="shadow-md mt-6">
          <CardContent className="p-6 text-center">
            <PackageIcon className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <p className="mt-4 text-lg font-medium">No items sold in this date range</p>
            <p className="text-sm text-slate-500 mt-2">Try selecting a different date range or department</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}