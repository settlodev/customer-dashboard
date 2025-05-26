'use client'
import { useState} from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  CalendarIcon,
  DollarSign,
  Package as PackageIcon,
  ShoppingCart,
  User
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { toast } from "@/hooks/use-toast";
import SubmitButton from '@/components/widgets/submit-button';
import { cn } from "@/lib/utils";
import { ItemRefunds, RefundReport } from "@/types/refunds/type";
import { GetRefundReport } from "@/lib/actions/refund-actions";


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
    currency: 'TSH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function RefundReportPage() {
  // State management
  const [refunds, setRefunds] = useState<RefundReport>();
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await GetRefundReport(formValues.startDate.toISOString(), formValues.endDate.toISOString());
      setRefunds(data);
    } catch (error) {
      console.error("Error fetching refund report:", error);
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

          <div>
                    <h1 className="text-2xl font-bold text-gray-800">Refund Report</h1>
                    
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
          {refunds && (
            <>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Refunds</p>
                    <p className="text-xl font-semibold">{refunds.totalRefunds}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Refunded Amount</p>
                    <p className="text-xl font-semibold">{formatCurrency(refunds.totalRefundsAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Returned Cost</p>
                    <p className="text-xl font-semibold">{formatCurrency(refunds.totalReturnedCost)}</p>
                  </div>
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
      {!loading && refunds && refunds.refundedItems && refunds.refundedItems.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center">
              <PackageIcon className="mr-2 h-5 w-5 text-teal-600" aria-hidden="true" />
              Items Refunded
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 divide-y">
                {refunds.refundedItems.map((item: ItemRefunds, index: number) => (
                  <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">{item.orderItemName}</h3>
                            {/* <p className="text-sm text-slate-500">{item.variantName}</p> */}
                            <div className="flex items-center mt-1">
                              {/* <p className="bg-slate-100 text-slate-700 p-1 rounded">{item.staffName}</p> */}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 md:mt-0">

                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <PackageIcon className="h-4 w-4 text-blue-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">Quantity</p>
                          <p className="font-semibold">{item.quantity} units</p>
                        </div>

                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <DollarSign className="h-4 w-4 text-emerald-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">Refund Amount</p>
                          <p className="font-semibold">{formatCurrency(item.refundAmount)}</p>
                        </div>

                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <DollarSign className="h-4 w-4 text-emerald-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">Returned Cost</p>
                          <p className="font-semibold">{formatCurrency(item.returnedCost)}</p>
                        </div>

                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <CalendarDays className="h-4 w-4 text-amber-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">Latest Sold</p>
                          <p className="font-semibold text-xs">{format(new Date(item.latestRefunded), "dd MMM HH:mm")}</p>
                        </div>

                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                          <CalendarDays className="h-4 w-4 text-amber-500 mb-1" aria-hidden="true" />
                          <p className="text-xs text-slate-500">Earliest Sold</p>
                          <p className="font-semibold text-xs">{format(new Date(item.earliestRefunded), "dd MMM HH:mm")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" aria-hidden="true" />
                        <span>Refunded by: {item.staffName || "Staff"}</span>
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
      {!loading && refunds && (!refunds.refundedItems || refunds.refundedItems.length === 0) && (
        <Card className="shadow-md mt-6">
          <CardContent className="p-6 text-center">
            <PackageIcon className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <p className="mt-4 text-lg font-medium">No items refunded in this date range</p>
            <p className="text-sm text-slate-500 mt-2">Try selecting a different date range </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}