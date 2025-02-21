"use client";

import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ListFilter,
  Search,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataTableViewOptions } from "@/components/tables/column-toggle";
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";
import { ProductCSVDialog} from "../csv/CSVImport";
import { CSVStockDialog } from "../csv/stockCsvImport";
import { ProductWithStockCSVDialog } from "../csv/ProductWithStockCsvImport";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import Loading from "@/app/loading";
import { usePaginationState } from "@/hooks/usePaginationState";
// import TableExport from "../widgets/export";
// import { StockIntake } from "@/types/stock-intake/type";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey: string;
  pageNo: number;
  total: number;
  pageSizeOptions?: number[];
  pageCount: number;
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
  filterKey?: string; // Optional: Key to filter by (e.g., "orderStatus")
    filterOptions?: { label: string; value: string }[]; // Optional: Filter options (e.g., "CLOSED", "OPEN")
}

export function DataTable<TData, TValue>({
   columns,
   data,
   searchKey,
   pageCount,
   pageSizeOptions = [10, 20, 30, 40, 50,100],
   filterKey,
   filterOptions
 }: DataTableProps<TData , TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  

  const { initializePaginationState, savePaginationState } = usePaginationState({
    key: pathname.replace('/', '') // Use the route as the key, e.g., 'products'
  });

  // Initialize state on component mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      initializePaginationState();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Search params
  const page = searchParams?.get("page") ?? "1";
  const pageAsNumber = Number(page);
  const fallbackPage = isNaN(pageAsNumber) || pageAsNumber < 1 ? 1 : pageAsNumber;
  const per_page = searchParams?.get("limit") ?? "10";
  const perPageAsNumber = Number(per_page);
  const fallbackPerPage = isNaN(perPageAsNumber) ? 10 : perPageAsNumber;
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  // console.log('Current pagination state:', {
  //   page: fallbackPage,
  //   pageSize: fallbackPerPage,
  //   pathname,
  //   searchParams: Object.fromEntries(searchParams?.entries() ?? [])
  // });

   // Save pagination state when it changes
   React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const paginationState = {
        pageIndex: fallbackPage - 1,
        pageSize: fallbackPerPage,
        timestamp: Date.now(),
      };
      localStorage.setItem('pagination-products', JSON.stringify(paginationState));
    }
  }, [fallbackPage, fallbackPerPage]);

  React.useEffect(() => {
    if (!searchParams?.has("_rsc")) {
      savePaginationState(String(fallbackPage), String(fallbackPerPage));
    }
  }, [fallbackPage, fallbackPerPage]);
  
  // Loading state
  const [loading, setLoading] = React.useState<boolean>(false);

  // Handle status filter change
  const handleStatusFilterChange = (newStatus: string) => {
    console.log("Selected Status:", newStatus);
    setStatusFilter(newStatus); 
  };

  // Filter data based on status (if filterKey is provided)
  const filteredData = React.useMemo(() => {
    if (!filterKey || !statusFilter) return data; // If no filter is selected, return all data
    return data.filter((item) => (item as any)[filterKey] === statusFilter); // Use filterKey to filter data
  }, [data, statusFilter, filterKey]);

  // console.log("Filtered Data:", filteredData);

  // Create query string
  const createQueryString = React.useCallback(
      (params: Record<string, string | number | null>) => {
        const newSearchParams = new URLSearchParams(searchParams?.toString());

        for (const [key, value] of Object.entries(params)) {
          if (value === null) {
            newSearchParams.delete(key);
          } else {
            newSearchParams.set(key, String(value));
          }
        }

        return newSearchParams.toString();
      },
      [searchParams],
  );

  // Handle server-side pagination
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
      pageIndex: fallbackPage - 1,
      pageSize: fallbackPerPage,
  });

  // Update URL when pagination changes
  React.useEffect(() => {
      const newPage = pageIndex + 1;
      const queryString = createQueryString({
          page: newPage,
          limit: pageSize,
      });

      // Set loading to true when changing pages
      setLoading(true);

      // Use replace instead of push to avoid adding to history
      router.replace(`${pathname}?${queryString}`, { scroll: false });
  }, [pageIndex, pageSize]);

  // Reset loading state after data is fetched
  React.useEffect(() => {
      // Simulate data fetching delay
      const timer = setTimeout(() => {
          setLoading(false);
      }, 500); // Adjust the delay as needed

      return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [data]); // This effect runs when data changes

  const table = useReactTable({
      data: filteredData,
      columns,
      pageCount: pageCount ?? -1,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: {
          sorting,
          pagination: { pageIndex, pageSize },
      },
      onPaginationChange: setPagination,
      getPaginationRowModel: getPaginationRowModel(),
      manualPagination: true,
      manualFiltering: true,
      enableRowSelection: true,
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
  });

  // Handle search
  const searchValue = table.getColumn(searchKey)?.getFilterValue() as string;

  React.useEffect(() => {
      if (searchValue?.length > 0) {
          const queryString = createQueryString({
              page: 1, // Reset to first page on search
              limit: pageSize,
              search: searchValue,
          });
          router.replace(`${pathname}?${queryString}`, { scroll: false });
      } else if (searchValue?.length === 0 || searchValue === undefined) {
          const queryString = createQueryString({
              page: 1,
              limit: pageSize,
              search: null,
          });
          router.replace(`${pathname}?${queryString}`, { scroll: false });
      }
  }, [searchValue]);

  return (
    <motion.div>
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            placeholder="Search..."
            type="search"
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
          />
        </div>


        <div className="flex items-center space-x-2">
          <DataTableViewOptions table={table} />

          {filterKey && filterOptions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    className="h-8 gap-1"
                                    disabled={false}
                                    size="sm"
                                    variant="outline"
                                >
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                        Filter
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                              
                                {filterOptions.map((option) => (
                                    <DropdownMenuCheckboxItem
                                        key={option.value}
                                        checked={statusFilter === option.value}
                                        onSelect={() => handleStatusFilterChange(option.value)}
                                    >
                                        {option.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

         {pathname === "/products" ?  <ProductCSVDialog /> : null}
         {pathname === "/stock-variants" ?  <CSVStockDialog /> : null}
         {pathname === "/stock-variants" ?  <ProductWithStockCSVDialog /> : null}
         {/* {pathname === "/stock-intakes" ?  <TableExport data={data as StockIntake[]}/>: null} */}

        </div>
      </div>

      {loading ? ( // Show loader while loading
        <div className="flex items-center justify-center h-48">
          <Loading/>
        </div>
      ) : (
        <ScrollArea className="rounded-md border h-[calc(80vh-220px)]">
          <Table className="relative">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-24 text-center"
                    colSpan={columns.length}
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <div className="flex flex-col gap-2 sm:flex-row items-center justify-end space-x-2 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="whitespace-nowrap text-sm font-medium">
                Rows per page
              </p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              aria-label="Go to first page"
              className="hidden h-8 w-8 p-0 lg:flex"
              disabled={!table.getCanPreviousPage()}
              variant="outline"
              onClick={() => table.setPageIndex(0)}
            >
              <DoubleArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Go to previous page"
              className="h-8 w-8 p-0"
              disabled={!table.getCanPreviousPage()}
              variant="outline"
              onClick={() => table.previousPage()}
            >
              <ChevronLeftIcon aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Go to next page"
              className="h-8 w-8 p-0"
              disabled={!table.getCanNextPage()}
              variant="outline"
              onClick={() => table.nextPage()}
            >
              <ChevronRightIcon aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Go to last page"
              className="hidden h-8 w-8 p-0 lg:flex"
              disabled={!table.getCanNextPage()}
              variant="outline"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            >
              <DoubleArrowRightIcon aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


