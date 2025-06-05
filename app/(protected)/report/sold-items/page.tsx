
'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDaysIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, DollarSignIcon, PackageIcon, TrendingUpIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SoldItemsReports } from '@/lib/actions/product-actions';
import { Form, FormField, FormItem } from '@/components/ui/form';
import { z } from 'zod';
import { FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SoldItem, SoldItemsReport } from '@/types/product/type';
import SubmitButton from '@/components/widgets/submit-button';
import { toast } from '@/hooks/use-toast';

import Loading from '../../loading';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

const FormSchema = z.object({
  startDate: z.date({ required_error: "Start date and time are required." }),
  endDate: z.date({ required_error: "End date and time are required." }),
  limit: z.number().optional(),
});

const SoldItemsDashboard = () => {
  const [startDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [endDate] = useState(new Date());
  const [soldData, setSoldData] = useState<SoldItemsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 5;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [paginatedItems, setPaginatedItems] = useState<SoldItem[]>([]);

  useEffect(() => {
    const fetchingSoldItems = async () => {
      try {
        const response = await SoldItemsReports(startDate, endDate);
        setSoldData(response);
      } catch (error) {
        console.error("Error fetching sold items report:", error);
      }
      finally {
        setIsLoading(false);
      }
    };

    fetchingSoldItems();
  }, []);

  // Update paginated items whenever soldData changes or pagination settings change
  useEffect(() => {
    if (soldData && soldData.items) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setPaginatedItems(soldData.items.slice(startIndex, endIndex));
    }
  }, [soldData, currentPage, itemsPerPage]);

  const totalPages = soldData ? Math.ceil(soldData.items.length / itemsPerPage) : 0;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      startDate: (() => {
        const now = new Date();
        now.setHours(0, 0, 0, 1);
        return now;
      })(),
      endDate: new Date(),
      limit: limit,
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Errors during form submission:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' && errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    try {
      setIsLoading(true);
      const response = await SoldItemsReports(values.startDate, values.endDate);
      setSoldData(response);
      setCurrentPage(1); // Reset to first page on new search
    } catch (error) {
      console.error("Error fetching stock history:", error);
    }
    finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat().format(value) || 0;
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen mt-16">
      <div className="w-full flex justify-end mb-4">
        <div className="w-full md:w-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-full md:w-auto">
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        label="Start Date"
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-full md:w-auto">
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        label="End Date"
                      />
                    </FormItem>
                  )}
                />
                <div className="w-full md:w-auto">
                  <SubmitButton
                    isPending={form.formState.isSubmitting}
                    label="Filter"
                    margin={6}
                    className="w-full md:w-auto"
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      <Card className="shadow-md w-full">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center">
            <TrendingUpIcon className="mr-2 h-5 w-5 text-teal-600" />
            Sold Items Summary
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-2 pt-4">
            <div className="flex flex-wrap items-center justify-between border-b pb-2">
              <p className="text-sm font-medium text-slate-500">Items Sold:</p>
              <p className="font-medium text-right">{soldData?.totalQuantity} units</p>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-2">
              <p className="text-sm font-medium text-slate-500">Total Revenue:</p>
              <p className="font-medium text-emerald-600 text-lg">
                {formatCurrency(soldData?.totalRevenue ?? 0)}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-2">
              <p className="text-sm font-medium text-slate-500">Total Cost of Goods:</p>
              <p className="font-medium text-red-600 text-lg">
                {formatCurrency(soldData?.totalCost ?? 0)}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-2">
              <p className="text-sm font-medium text-slate-500">
                {(soldData?.totalProfit ?? 0) < 0 ? "Total Loss" : "Total Profit"}:
              </p>
              <p
                className={`font-medium text-lg ${(soldData?.totalProfit ?? 0) < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
              >
                {formatCurrency(soldData?.totalProfit ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      <Card className="shadow-md">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center">
            <PackageIcon className="mr-2 h-5 w-5 text-teal-600" />
            List of Sold Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* Paginated Items */}
            <div className="grid grid-cols-1 divide-y">
              {paginatedItems.map((item: SoldItem, index: number) => (
                <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 min-w-16 bg-slate-200 rounded-md flex items-center justify-center">
                          {!item.imageUrl && (
                            <PackageIcon className="h-6 w-6 text-slate-400" />
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

                    <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-6 gap-4 mt-3 md:mt-0">
                      <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                        <DollarSignIcon className="h-4 w-4 text-emerald-500 mb-1" />
                        <p className="text-xs text-slate-500">Price</p>
                        <p className="font-semibold">{(item.price)}</p>
                      </div>

                      <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                        <DollarSignIcon className="h-4 w-4 text-red-500 mb-1" />
                        <p className="text-xs text-slate-500">Cost</p>
                        <p className="font-semibold">{formatCurrency(item.cost)}</p>
                      </div>

                      <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                        <PackageIcon className="h-4 w-4 text-blue-500 mb-1" />
                        <p className="text-xs text-slate-500">Quantity</p>
                        <p className="font-semibold">{item.quantity} units</p>
                      </div>

                      <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                        <DollarSignIcon className={`h-4 w-4 mb-1 font-semibold ${(item?.profit ?? 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                        <p className="text-xs text-slate-500">{item.profit < 0 ? 'Loss' : 'Profit'}</p>
                        <p className={`font-semibold ${(item?.profit ?? 0) < 0 ? 'text-red-600' : ' text-purple-500'}`}>
                          {formatCurrency(item.profit)}</p>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                        <CalendarDaysIcon className="h-4 w-4 text-amber-500 mb-1" />
                        <p className="text-xs text-slate-500">Latest Sold</p>
                        <p className="font-semibold text-xs">{format(new Date(item.latestSoldDate), "dd MMM HH:mm")}</p>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                        <CalendarDaysIcon className="h-4 w-4 text-amber-500 mb-1" />
                        <p className="text-xs text-slate-500">Earliest Sold</p>
                        <p className="font-semibold text-xs">{format(new Date(item.earliestSoldDate), "dd MMM HH:mm")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                    <div className="flex items-center">
                      <UserIcon className="h-3 w-3 mr-1" />
                      <span>Sold by: {item.staffName}</span>
                    </div>
                    <div>Price: {formatCurrency(item.price)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-center border-t">
              <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                <span className="text-sm text-slate-500">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="bg-white border rounded-md p-1 text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm text-slate-500">
                  Showing {paginatedItems.length} of {soldData?.items.length || 0} items
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Calculate which pages to show
                    let pageToShow;
                    if (totalPages <= 5) {
                      pageToShow = i + 1;
                    } else if (currentPage <= 3) {
                      pageToShow = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i;
                    } else {
                      pageToShow = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageToShow ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageToShow)}
                        className="w-8 h-8 p-0"
                      >
                        {pageToShow}
                      </Button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-slate-400">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoldItemsDashboard;




