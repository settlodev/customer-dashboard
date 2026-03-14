"use client";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpCircle,
  CalendarIcon,
  DollarSign,
  Receipt,
  RefreshCcw,
  TrendingDown,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cashFlowReport } from "@/lib/actions/order-actions";
import { CashFlow } from "@/types/orders/type";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Loading from "@/components/ui/loading";

function DateTimePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      const newDate = new Date(selected);
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      onChange(newDate);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    const newDate = new Date(value);
    if (type === "hour") {
      newDate.setHours(parseInt(val, 10));
    } else {
      newDate.setMinutes(parseInt(val, 10));
    }
    onChange(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="hidden mr-2 h-4 w-4" />
          {format(value, "MM/dd/yyyy HH:mm")}
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
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={value.getHours() === hour ? "default" : "ghost"}
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
                    variant={
                      value.getMinutes() === minute ? "default" : "ghost"
                    }
                    onClick={() =>
                      handleTimeChange("minute", minute.toString())
                    }
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
  );
}

const CashFlowReportDashboard = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  });
  const [endDate, setEndDate] = useState(new Date());
  const [cashfData, setCashData] = useState<CashFlow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await cashFlowReport(startDate, endDate);
        console.log("Cash flow report:", response);
        setCashData(response);
      } catch (error) {
        console.error("Error fetching cash flow report:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilter = async () => {
    setIsFiltering(true);
    try {
      const response = await cashFlowReport(startDate, endDate);
      setCashData(response);
    } catch (error) {
      console.error("Error fetching cash flow report:", error);
    } finally {
      setIsFiltering(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `${new Intl.NumberFormat().format(value)} TZS`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 space-y-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Cash flow report
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Overview of transactions, expenses and refunds
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <DateTimePicker value={startDate} onChange={setStartDate} />
          <DateTimePicker value={endDate} onChange={setEndDate} />
          <Button onClick={handleFilter} disabled={isFiltering}>
            {isFiltering ? (
              <div className="border-t-transparent border-4 border-green-500 w-[20px] h-[20px] rounded-full animate-spin" />
            ) : (
              "Filter"
            )}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(cashfData?.transactionsAmount || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {cashfData?.transactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expenses
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(cashfData?.expensesPaidAmount || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {cashfData?.expensePayments || 0} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Refunds
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <RefreshCcw className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(cashfData?.refundsAmount || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {cashfData?.refunds || 0} refunds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Closing balance
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {(cashfData?.closingBalance || 0) >= 0 ? (
                <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className={`text-2xl font-bold ${(cashfData?.closingBalance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(cashfData?.closingBalance || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment methods table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Breakdown by payment method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Payment method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashfData?.paymentMethodTotals?.length ? (
                cashfData.paymentMethodTotals.map((method, index) => (
                  <TableRow key={`${method.paymentMethodName}-${index}`}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {method.paymentMethodName}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(method.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No payment data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};

export default CashFlowReportDashboard;
