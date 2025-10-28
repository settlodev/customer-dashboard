import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  ArrowUp,
  Trash,
  Redo,
  Pen,
  BadgePlus,
  PencilLine,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { StockMovement } from "@/types/stockVariant/type";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

const DateTimePicker = ({ value, onChange, label }: DatePickerProps) => {
  function handleDateSelect(date: Date | undefined) {
    if (date) {
      const newDate = new Date(date);
      // Preserve the current time when changing the date
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
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "MMM do, yyyy HH:mm")
            ) : (
              <span>Pick date and time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="p-2">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleDateSelect}
                initialFocus
              />
            </div>
            <div className="border-l flex flex-row sm:flex-col p-2 sm:h-[300px]">
              <ScrollArea className="w-full h-full">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium pl-2 pb-1">Hours</p>
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <Button
                      key={hour}
                      variant={value.getHours() === hour ? "default" : "ghost"}
                      className="w-full"
                      onClick={() => handleTimeChange("hour", hour.toString())}
                    >
                      {hour.toString().padStart(2, "0")}:00
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <ScrollArea className="w-full h-full">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium pl-2 pb-1">Minutes</p>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      variant={
                        value.getMinutes() === minute ? "default" : "ghost"
                      }
                      className="w-full"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                    >
                      :{minute.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const PaginatedStockTable = ({
  movements,
  itemsPerPage = 10,
  currentPage,
  totalPages: serverTotalPages,
  totalElements: serverTotalElements,
}: {
  movements: StockMovement[];
  itemsPerPage?: number;
  currentPage: number;
  totalPages: number;
  totalElements: number;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  // Sort movements by date in descending order (newest first)
  const sortedMovements = useMemo(() => {
    return [...movements].sort(
      (a, b) =>
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
    );
  }, [movements]);

  // Filter movements based on date range
  const filteredMovements = useMemo(() => {
    if (!filterActive) return sortedMovements;

    const start = startDate.getTime();
    const end = endDate.getTime();

    return sortedMovements.filter((movement) => {
      const movementTime = new Date(movement.dateCreated).getTime();
      return movementTime >= start && movementTime <= end;
    });
  }, [sortedMovements, filterActive, startDate, endDate]);

  // Calculate pagination values based on filtered data
  const totalPages = filterActive
    ? Math.ceil(filteredMovements.length / itemsPerPage)
    : serverTotalPages || Math.ceil(filteredMovements.length / itemsPerPage);

  const totalItems = filterActive
    ? filteredMovements.length
    : serverTotalElements || filteredMovements.length;

  // For display purposes - when filtering, use client-side pagination
  const startIndex = filterActive ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = filterActive
    ? startIndex + itemsPerPage
    : filteredMovements.length;
  const currentItems = filterActive
    ? filteredMovements.slice(startIndex, endIndex)
    : filteredMovements;

  // Navigation functions
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const getMovementLabel = (type: string) => {
    const labels = {
      STOCK_INTAKE: "Stock Intake",
      ORDER_ITEM_SALE: "Sale of Item",
      ORDER_ITEM_REMOVE: "Removed Order Item",
      ORDER_ITEM_REFUND: "Refund of Order Item",
      ORDER_ITEM_AMOUNT_CHANGE: "Amount Change",
      ADDON_SALE: "Addon Sale",
      STOCK_MODIFICATION: "Modified Stock",
      TRANSFER_OUT: "Transfer Out",
      TRANSFER_IN: "Transfer In",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleRedirect = (movement: StockMovement) => {
    console.log("Redirecting to:", movement.stockMovementType);
    switch (movement.stockMovementType) {
      case "STOCK_INTAKE":
        if (movement.stockIntake) {
          router.push(
            `/stock-intakes/intake-detail/${movement.stockIntake}?stockVariant=${movement.stockVariant}`,
          );
        }
        break;
      case "ORDER_ITEM_SALE":
        if (movement.order) {
          router.push(`/orders/${movement.order}`);
        }
        break;
      case "ORDER_ITEM_REMOVE":
        if (movement.order) {
          router.push(`/orders/${movement.order}`);
        }
        break;
      case "ORDER_ITEM_REFUND":
        if (movement.order) {
          router.push(`/refunds/${movement.order}`);
        }
        break;
      case "STOCK_MODIFICATION":
        if (movement.stockModification) {
          router.push(`/stock-modification/${movement.stockModification}`);
        }
        break;
      default:
        console.log("No redirect configured for this movement type");
    }
  };

  const handleFilter = () => {
    setIsFiltering(true);

    // Use setTimeout to allow the UI to update before filtering
    setTimeout(() => {
      setFilterActive(true);
      if (currentPage !== 1) {
        goToPage(1);
      }
      setIsFiltering(false);
    }, 0);
  };

  const resetFilter = () => {
    setIsFiltering(true);

    setTimeout(() => {
      setFilterActive(false);
      if (currentPage !== 1) {
        goToPage(1);
      }
      setIsFiltering(false);

      // Reset date filters to default
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setStartDate(today);
      setEndDate(new Date());
    }, 0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:justify-between">
        <div></div>
        <div className="w-full lg:w-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2">
            <div className="w-full sm:w-auto">
              <DateTimePicker
                label="From"
                value={startDate}
                onChange={setStartDate}
              />
            </div>
            <div className="w-full sm:w-auto">
              <DateTimePicker
                label="To"
                value={endDate}
                onChange={setEndDate}
              />
            </div>
            <div className="flex gap-2 w-full lg:w-auto lg:ml-4 mt-2 lg:mt-4">
              <Button
                variant="default"
                className="flex-1"
                onClick={handleFilter}
                disabled={isFiltering}
              >
                {isFiltering ? "Filtering..." : "Filter"}
              </Button>
              {filterActive && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetFilter}
                  disabled={isFiltering}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-2 font-medium">#</th>
                <th className="text-left p-2 font-medium">Type</th>
                <th className="text-left p-2 font-medium">Quantity</th>
                <th className="text-left p-2 font-medium">Running Total</th>
                <th className="text-left p-2 font-medium hidden md:table-cell">
                  Staff
                </th>
                <th className="text-left p-2 font-medium hidden md:table-cell">
                  Date
                </th>
                <th className="text-left p-2 font-medium md:hidden">Details</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((movement, index) => (
                  <tr
                    key={movement.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRedirect(movement)}
                  >
                    <td className="p-2">{startIndex + index + 1}</td>
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center px-3 py-2 rounded-md text-xs font-medium ${
                          movement.stockMovementType === "STOCK_INTAKE"
                            ? "bg-green-100 text-green-800"
                            : movement.stockMovementType === "ORDER_ITEM_SALE"
                              ? "bg-blue-100 text-blue-800"
                              : movement.stockMovementType ===
                                  "ORDER_ITEM_DELETE"
                                ? "bg-gray-100 text-gray-800"
                                : movement.stockMovementType ===
                                    "ORDER_ITEM_REFUND"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : movement.stockMovementType ===
                                      "ORDER_ITEM_AMOUNT_CHANGE"
                                    ? "bg-purple-100 text-purple-800"
                                    : movement.stockMovementType ===
                                        "ADDON_SALE"
                                      ? "bg-orange-100 text-orange-800"
                                      : movement.stockMovementType ===
                                          "STOCK_MODIFICATION"
                                        ? "bg-pink-100 text-pink-800"
                                        : movement.stockMovementType ===
                                            "TRANSFER_OUT"
                                          ? "bg-indigo-100 text-indigo-800"
                                          : movement.stockMovementType ===
                                              "TRANSFER_IN"
                                            ? "bg-teal-100 text-teal-800"
                                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getMovementLabel(movement.stockMovementType)}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span>
                          {movement.stockMovementType === "ORDER_ITEM_SALE" ? (
                            <ArrowUp className="h-4 w-4 text-red-500" />
                          ) : movement.stockMovementType === "STOCK_INTAKE" ? (
                            <ArrowDown className="h-4 w-4 text-green-500" />
                          ) : movement.stockMovementType ===
                            "ORDER_ITEM_DELETE" ? (
                            <Trash className="h-4 w-4 text-red-500" />
                          ) : movement.stockMovementType ===
                            "ORDER_ITEM_REFUND" ? (
                            <Redo className="h-4 w-4 text-yellow-500" />
                          ) : movement.stockMovementType ===
                            "ORDER_ITEM_AMOUNT_CHANGE" ? (
                            <Pen className="h-4 w-4 text-purple-500" />
                          ) : movement.stockMovementType === "ADDON_SALE" ? (
                            <BadgePlus className="h-4 w-4 text-orange-500" />
                          ) : movement.stockMovementType ===
                            "STOCK_MODIFICATION" ? (
                            <PencilLine className="h-4 w-4 text-pink-800" />
                          ) : movement.stockMovementType === "TRANSFER_OUT" ? (
                            <TrendingDown className="h-4 w-4 text-indigo-500" />
                          ) : movement.stockMovementType === "TRANSFER_IN" ? (
                            <TrendingUp className="h-4 w-4 text-teal-500" />
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </span>
                        {Intl.NumberFormat().format(movement.quantity)}
                      </div>
                    </td>
                    <td className="p-2">
                      {Intl.NumberFormat().format(movement.newTotalQuantity)}
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      {movement.staffName !== ""
                        ? movement.staffName
                        : movement.warehouseStaffName}
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      {Intl.DateTimeFormat(undefined, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(movement.dateCreated))}
                    </td>

                    {/* Mobile-only compact details column */}
                    <td className="p-2 md:hidden">
                      <div className="text-xs text-gray-500">
                        <div>{movement.staffName}</div>
                        <div>
                          {Intl.DateTimeFormat(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          }).format(new Date(movement.dateCreated))}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    No stock movements found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Pagination Controls */}
        {filteredMovements.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-4">
            <div className="text-sm text-gray-500 order-2 sm:order-1">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredMovements.length)} of{" "}
              {filteredMovements.length} entries
            </div>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {totalPages > 0 &&
                  (() => {
                    // Responsive pagination logic
                    let pagesToShow = [];
                    if (totalPages <= 5) {
                      // Show all pages if 5 or fewer
                      pagesToShow = Array.from(
                        { length: totalPages },
                        (_, i) => i + 1,
                      );
                    } else {
                      // Always show first page
                      pagesToShow.push(1);

                      // Add ellipsis if needed
                      if (currentPage > 3) {
                        pagesToShow.push("ellipsis1");
                      }

                      // Add pages around current page
                      const startPage = Math.max(2, currentPage - 1);
                      const endPage = Math.min(totalPages - 1, currentPage + 1);

                      for (let i = startPage; i <= endPage; i++) {
                        pagesToShow.push(i);
                      }

                      // Add ellipsis if needed
                      if (currentPage < totalPages - 2) {
                        pagesToShow.push("ellipsis2");
                      }

                      // Always show last page
                      if (totalPages > 1) {
                        pagesToShow.push(totalPages);
                      }
                    }

                    return pagesToShow.map((page) => {
                      if (page === "ellipsis1" || page === "ellipsis2") {
                        return (
                          <span key={page} className="px-2">
                            ...
                          </span>
                        );
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(Number(page))}
                          className="h-8 w-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    });
                  })()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaginatedStockTable;
