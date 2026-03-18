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
  MoreHorizontal,
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
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { ProductCSVDialog } from "../csv/CSVImport";
import { CSVStockDialog } from "../csv/stockCsvImport";
import { ProductWithStockCSVDialog } from "../csv/ProductWithStockCsvImport";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Loading from "@/components/ui/loading";
import { usePaginationState } from "@/hooks/usePaginationState";
import TableExport from "../widgets/export";
import StockExport from "../widgets/export-stock";
import StockIntakeExport from "../widgets/export-intake";
import { CSVStockIntakeDialog } from "../csv/stockIntakeImport";
import { BulkArchive } from "../widgets/bulk-archive";
import { WarehouseBulkArchive } from "../widgets/warehouse/bulk-archive";

// Define page-specific component mappings
const pageSpecificComponents = {
  "/products": {
    entityType: "product" as const,
    importComponent: null,
    exportComponent: null,
    entityNames: { singular: "Product", plural: "Products" },
    allowArchive: true,
    isWarehouse: false,
  },
  "/stock-variants": {
    entityType: "stock" as const,
    importComponent: (
      <>
        <CSVStockDialog uploadType="location" />
        <ProductWithStockCSVDialog />
      </>
    ),
    exportComponent: <StockExport filename="stock" exportType="location" />,
    entityNames: { singular: "Stock Variant", plural: "Stock Variants" },
    allowArchive: true,
    isWarehouse: false,
  },
  "/stock-intakes": {
    entityType: "stock-intake" as const,
    importComponent: <CSVStockIntakeDialog />,
    exportComponent: <StockIntakeExport filename="Stock Intake" />,
    entityNames: { singular: "Stock Intake", plural: "Stock Intakes" },
    allowArchive: true,
    isWarehouse: false,
  },
  "/staff": {
    entityType: "staff" as const,
    importComponent: null,
    exportComponent: null,
    entityNames: { singular: "Staff Member", plural: "Staff Members" },
    isWarehouse: false,
  },
  "/recipes": {
    entityType: "recipe" as const,
    importComponent: null,
    exportComponent: null,
    entityNames: { singular: "Recipe", plural: "Recipes" },
    allowArchive: false,
    isWarehouse: false,
  },
  "/warehouse-stock-variants": {
    entityType: "stock" as const,
    importComponent: (
      <>
        <CSVStockDialog uploadType="warehouse" />
      </>
    ),
    exportComponent: (
      <StockExport
        filename="Exporting Warehouse stock"
        exportType="warehouse"
      />
    ),
    entityNames: { singular: "Stock Variant", plural: "Stock Variants" },
    isWarehouse: true,
  },
  "/warehouse-stock-intakes": {
    entityType: "stock-intake" as const,
    importComponent: <CSVStockIntakeDialog />,
    exportComponent: <StockIntakeExport filename="Warehouse Stock Intake" />,
    entityNames: { singular: "Stock Intake", plural: "Stock Intakes" },
    isWarehouse: true,
  },
  "/warehouse-suppliers": {
    entityType: "supplier" as const,
    importComponent: "",
    exportComponent: "",
    entityNames: { singular: "Supplier", plural: "Suppliers" },
    isWarehouse: true,
  },
};

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
  filterKey?: string;
  filterOptions?: { label: string; value: string }[];
  disableArchive?: boolean;
  onRowClick?: (row: TData) => void;
  rowClickBasePath?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pageCount,
  pageSizeOptions = [10, 20, 30, 40, 50, 100],
  filterKey,
  filterOptions,
  disableArchive = false,
  onRowClick,
  rowClickBasePath,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { initializePaginationState, savePaginationState } = usePaginationState(
    { key: pathname.replace("/", "") },
  );

  const page = searchParams?.get("page") ?? "1";
  const pageAsNumber = Number(page);
  const fallbackPage =
    isNaN(pageAsNumber) || pageAsNumber < 1 ? 1 : pageAsNumber;
  const per_page = searchParams?.get("limit") ?? "10";
  const perPageAsNumber = Number(per_page);
  const fallbackPerPage = isNaN(perPageAsNumber) ? 10 : perPageAsNumber;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!isInitialized) {
      const timer = setTimeout(() => {
        initializePaginationState();
        setIsInitialized(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initializePaginationState, isInitialized]);

  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: fallbackPage - 1,
      pageSize: fallbackPerPage,
    });

  React.useEffect(() => {
    if (isInitialized) {
      setPagination({
        pageIndex: fallbackPage - 1,
        pageSize: fallbackPerPage,
      });
    }
  }, [fallbackPage, fallbackPerPage, isInitialized]);

  React.useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      const paginationState = {
        pageIndex,
        pageSize,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        `pagination-${pathname.replace("/", "") || "default"}`,
        JSON.stringify(paginationState),
      );
    }
  }, [pageIndex, pageSize, pathname, isInitialized]);

  const [pendingPagination, setPendingPagination] =
    React.useState<PaginationState | null>(null);

  React.useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      if (pendingPagination) {
        const newPage = pendingPagination.pageIndex + 1;
        const queryString = createQueryString({
          page: newPage,
          limit: pendingPagination.pageSize,
        });
        setLoading(true);
        router.replace(`${pathname}?${queryString}`, { scroll: false });
        setPendingPagination(null);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pendingPagination, isInitialized, pathname, router]);

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
  };

  const filteredData = React.useMemo(() => {
    if (!filterKey || !statusFilter) return data;
    return data.filter((item) => (item as any)[filterKey] === statusFilter);
  }, [data, statusFilter, filterKey]);

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

  const handlePaginationChange = React.useCallback(
    (updater: any) => {
      const newPagination =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPagination(newPagination);
      setPendingPagination(newPagination);
      if (!searchParams?.has("_rsc")) {
        savePaginationState(
          String(newPagination.pageIndex + 1),
          String(newPagination.pageSize),
        );
      }
    },
    [pageIndex, pageSize, searchParams, savePaginationState],
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [data]);

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
    onPaginationChange: handlePaginationChange,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    enableRowSelection: true,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
  });

  const searchValue = table.getColumn(searchKey)?.getFilterValue() as string;

  const [searchTimeout, setSearchTimeout] =
    React.useState<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!isInitialized) return;
    if (searchTimeout) clearTimeout(searchTimeout);

    const newTimeout = setTimeout(() => {
      if (searchValue?.length > 0) {
        const queryString = createQueryString({
          page: 1,
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
    }, 300);

    setSearchTimeout(newTimeout);
    return () => {
      if (newTimeout) clearTimeout(newTimeout);
    };
  }, [searchValue, pageSize, isInitialized]);

  const selectedRowIds = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => (row.original as any).id);

  const pageConfig = pageSpecificComponents[
    pathname as keyof typeof pageSpecificComponents
  ] || {
    entityType: "product" as const,
    importComponent: null,
    exportComponent: null,
    entityNames: { singular: "Item", plural: "Items" },
    allowArchive: false,
    isWarehouse: false,
  };

  const resetTableSelection = () => {
    table.resetRowSelection();
  };

  const renderArchiveComponent = () => {
    if (disableArchive || selectedRowIds.length === 0) return null;

    if (pageConfig.isWarehouse) {
      return (
        <WarehouseBulkArchive
          selectedIds={selectedRowIds}
          entityType={
            pageConfig.entityType as "stock" | "stock-intake" | "supplier"
          }
          onSuccess={resetTableSelection}
          entityNameSingular={pageConfig.entityNames.singular}
          entityNamePlural={pageConfig.entityNames.plural}
        />
      );
    } else {
      return (
        <BulkArchive
          selectedIds={selectedRowIds}
          entityType={
            pageConfig.entityType as
              | "product"
              | "stock"
              | "staff"
              | "stock-intake"
          }
          onSuccess={resetTableSelection}
          entityNameSingular={pageConfig.entityNames.singular}
          entityNamePlural={pageConfig.entityNames.plural}
        />
      );
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loading />
      </div>
    );
  }

  return (
    <motion.div>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-2 gap-2">
        {/* Search */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            className="w-full rounded-md border-0 bg-muted pl-10 md:w-[200px] lg:w-[320px] transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

        {/* ✅ Desktop actions — lg and above */}
        <div className="hidden lg:flex items-center space-x-2">
          {renderArchiveComponent()}

          {filterKey && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 gap-1" size="sm" variant="outline">
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

          {pageConfig.importComponent}
          {pageConfig.exportComponent}
        </div>

        {/* ✅ Mobile / Tablet actions — below lg */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Archive stays inline — it's a contextual/important action */}
          {renderArchiveComponent()}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Actions
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {/* Filter options */}
              {filterKey && filterOptions && (
                <>
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
                  {(pageConfig.importComponent ||
                    pageConfig.exportComponent) && <DropdownMenuSeparator />}
                </>
              )}

              {/* Import / Export */}
              {(pageConfig.importComponent || pageConfig.exportComponent) && (
                <>
                  <DropdownMenuLabel>Import & Export</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {pageConfig.importComponent && (
                    <div
                      className="flex flex-col gap-1 px-2 py-1"
                      // ✅ Prevent dropdown dismissing before dialog opens
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {pageConfig.importComponent}
                    </div>
                  )}
                  {pageConfig.exportComponent && (
                    <div
                      className="flex flex-col gap-1 px-2 py-1"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {pageConfig.exportComponent}
                    </div>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loading />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table className="relative">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={
                      onRowClick || rowClickBasePath
                        ? "cursor-pointer hover:bg-muted/50"
                        : ""
                    }
                    onClick={(e) => {
                      if (!onRowClick && !rowClickBasePath) return;
                      const target = e.target as HTMLElement;
                      if (
                        target.closest("button") ||
                        target.closest("[role='menuitem']") ||
                        target.closest("[role='checkbox']") ||
                        target.closest("a") ||
                        target.closest("[data-no-row-click]")
                      )
                        return;
                      if (onRowClick) {
                        onRowClick(row.original);
                      } else if (rowClickBasePath) {
                        const id = (row.original as any).id;
                        if (id) router.push(`${rowClickBasePath}/${id}`);
                      }
                    }}
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
        </div>
      )}

      {/* ── Pagination ── */}
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
