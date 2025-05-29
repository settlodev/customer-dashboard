'use client'
import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  DollarSign,
  ShoppingCart,
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { toast } from "@/hooks/use-toast";
import SubmitButton from '@/components/widgets/submit-button';
import { cn } from "@/lib/utils";
import { ExpenseReport } from "@/types/expense/type";
import { GetExpenseReport } from "@/lib/actions/expense-actions";


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

export default function ExpenseReportPage() {
  // State management
  const [expenses, setExpenses] = useState<ExpenseReport>();
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
      const data = await GetExpenseReport(formValues.startDate.toISOString(), formValues.endDate.toISOString());
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expense report:", error);
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
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Expense Report</h1>
              <p className="text-gray-600 mt-1">View and analyze your expenses</p>
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
        <CardContent className="grid md:grid-cols-2 gap-4 p-6 mt-4">
          {expenses && (
            <>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(expenses.totalExpenses)}
                    </p>
                  </div>
                </div>
            </>
          )}
        </CardContent>
      </Card>

      {loading ? (
        /* Loading State */
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report...</p>
          </CardContent>
        </Card>
      ) : expenses ? (
        <>
          
          {/* Category Breakdown */}
          <Card className="mt-4">
            <CardHeader>
              <h2 className="text-lg font-semibold">Expense Categories</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.categorySummaries.map((category) => (
                  <div key={category.categoryName} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">
                        {category.categoryName}
                      </span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(category.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {category.percentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* No Data State */
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data</h3>
            <p className="text-gray-600">Select a date range to view expenses</p>
          </CardContent>
        </Card>
      )}
     
    </div>
  );
}