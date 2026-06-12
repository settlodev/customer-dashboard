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
import { CSVStockDialog } from "../csv/stockCsvImport";
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
import StockExport from "../widgets/export-stock";
import StockIntakeExport from "../widgets/export-intake";
import { BulkArchive } from "../widgets/bulk-archive";
// WarehouseBulkArchive removed — warehouse code rebuilt

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
    importComponent: <CSVStockDialog uploadType="location" />,
    exportComponent: <StockExport filename="stock" exportType="location" />,
    entityNames: { singular: "Stock Item", plural: "Stock Items" },
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
  "/bom-rules": {
    entityType: "bom-rule" as const,
    importComponent: null,
    exportComponent: null,
    entityNames: { singular: "Consumption rule", plural: "Consumption rules" },
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
    importComponent: null,
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
  pageNo?: number;
  total?: number;
  pageSizeOptions?: number[];
  pageCount?: number;
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
  filterKey?: string;
  filterOptions?: { label: string; value: string }[];
  /**
   * Drive pagination, search, and filtering entirely client-side over the
   * full `data` array — no URL or localStorage round-trips. Use when the
   * parent already loads the whole dataset in one shot (e.g. report tabs
   * that fetch every row), or when several tables share one screen and
   * therefore can't each own the URL's `?page`/`?search` namespace.
   * `pageCount`/`pageNo`/`total` are ignored in this mode (the table
   * derives them from the data).
   */
  clientMode?: boolean;
  /**
   * Sync the `filterKey` dropdown to the URL (`?<filterKey>=value`, resetting
   * to page 1) so a server component can re-query the filtered set, instead
   * of filtering the current page client-side. Mirrors `manualSort`. Only
   * meaningful alongside server-side pagination (i.e. when `clientMode` is
   * off). The URL param name is `filterKey`.
   */
  manualFilter?: boolean;
  /**
   * Hide the search input entirely. Use for server-paged tables whose
   * backend has no free-text search — a box that silently does nothing is
   * worse than no box.
   */
  hideSearch?: boolean;
  /**
   * Placeholder text for the search input. Defaults to "Search...".
   */
  searchPlaceholder?: string;
  /**
   * Additional client-side filters that compose with `filterKey`. Each
   * renders its own dropdown next to the primary filter; all active
   * filters AND together. Click the same option again to clear it.
   */
  extraFilters?: {
    key: string;
    label: string;
    options: { label: string; value: string }[];
  }[];
  disableArchive?: boolean;
  onRowClick?: (row: TData) => void;
  rowClickBasePath?: string;
  /**
   * Opt-in: drive column sorting through the URL (`?sort=field,dir`) so the
   * backend sorts the full dataset instead of just reordering the current
   * page client-side. Column ids must match backend sort fields. When
   * omitted, sorting stays client-side (current behaviour for other lists).
   */
  manualSort?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pageCount,
  pageSizeOptions = [10, 20, 30, 40, 50, 100],
  filterKey,
  filterOptions,
  extraFilters,
  disableArchive = false,
  onRowClick,
  rowClickBasePath,
  manualSort = false,
  clientMode = false,
  manualFilter = false,
  hideSearch = false,
  searchPlaceholder = "Search...",
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

  // Seed sorting from `?sort=field,dir` once on mount when server-side
  // sorting is enabled, so the header arrow matches the URL on first paint.
  const initialSorting = React.useMemo<SortingState>(() => {
    if (!manualSort) return [];
    const raw = searchParams?.get("sort");
    if (!raw) return [];
    const [id, dir] = raw.split(",");
    return id ? [{ id, desc: dir !== "asc" }] : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  // In manual (server-side) filter mode the dropdown's active value is owned
  // by the URL, so seed it from there on mount; otherwise it's local state.
  const [statusFilter, setStatusFilter] = React.useState<string>(() =>
    manualFilter && filterKey ? (searchParams?.get(filterKey) ?? "") : "",
  );
  // Per-key selection state for the optional extraFilters. Click the
  // same option to clear it; empty string means "no filter on this key".
  const [extraFilterValues, setExtraFilterValues] = React.useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = React.useState<boolean>(false);
  // Client-side mode never touches the URL/localStorage, so it's "initialized"
  // from the first paint — no async restore step to wait on.
  const [isInitialized, setIsInitialized] = React.useState(clientMode);

  React.useEffect(() => {
    if (!clientMode && !isInitialized) {
      const timer = setTimeout(() => {
        initializePaginationState();
        setIsInitialized(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initializePaginationState, isInitialized, clientMode]);

  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      // Client-side mode always starts at page 1 — a `?page` left in the URL
      // by a sibling server-paged tab must not seed it onto a fresh client
      // table. (It still inherits `?limit` as a sensible rows-per-page.)
      pageIndex: clientMode ? 0 : fallbackPage - 1,
      pageSize: fallbackPerPage,
    });

  React.useEffect(() => {
    if (!clientMode && isInitialized) {
      setPagination({
        pageIndex: fallbackPage - 1,
        pageSize: fallbackPerPage,
      });
    }
  }, [fallbackPage, fallbackPerPage, isInitialized, clientMode]);

  React.useEffect(() => {
    if (!clientMode && isInitialized && typeof window !== "undefined") {
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
  }, [pageIndex, pageSize, pathname, isInitialized, clientMode]);

  const [pendingPagination, setPendingPagination] =
    React.useState<PaginationState | null>(null);

  React.useEffect(() => {
    if (!isInitialized || clientMode) return;

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
  }, [pendingPagination, isInitialized, pathname, router, clientMode]);

  const handleStatusFilterChange = (newStatus: string) => {
    // Toggle: re-selecting the active option clears the filter so the
    // user can get back to "all" without leaving the page.
    const next = statusFilter === newStatus ? "" : newStatus;
    setStatusFilter(next);
    // Server-side filter: push the choice to the URL (resetting to page 1)
    // so the parent re-queries the full filtered set rather than filtering
    // just the visible page client-side.
    if (manualFilter && filterKey) {
      const queryString = createQueryString({
        [filterKey]: next.length > 0 ? next : null,
        page: 1,
      });
      router.replace(`${pathname}?${queryString}`, { scroll: false });
    }
  };

  const handleExtraFilterChange = (key: string, newValue: string) => {
    setExtraFilterValues((prev) => ({
      ...prev,
      [key]: prev[key] === newValue ? "" : newValue,
    }));
  };

  // Callers often pass `extraFilters` as a fresh array literal each
  // render. Depending on it directly would bust the filteredData memo
  // every time the parent re-rendered. Reduce it to a stable signature
  // (the ordered list of keys) so the memo only re-runs when the filter
  // config actually changes, not when the parent ticks.
  const extraFiltersSig = React.useMemo(
    () => (extraFilters ?? []).map((f) => f.key).join("|"),
    [extraFilters],
  );

  const filteredData = React.useMemo(() => {
    let result = data;
    // In manualFilter mode the server already returned the filtered set, so
    // re-filtering the page client-side would be redundant (and wrong if the
    // filter maps to a derived value rather than a raw field).
    if (filterKey && statusFilter && !manualFilter) {
      result = result.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item) => (item as any)[filterKey] === statusFilter,
      );
    }
    if (extraFilters) {
      for (const f of extraFilters) {
        const v = extraFilterValues[f.key];
        if (!v) continue;
        result = result.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item) => (item as any)[f.key] === v,
        );
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, statusFilter, filterKey, manualFilter, extraFiltersSig, extraFilterValues]);

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
      // Client-side: the table owns pagination internally — no URL push,
      // no localStorage. (Several client-mode tables can share one route,
      // so they must not write a shared `?page`/`pagination-<path>` key.)
      if (clientMode) return;
      setPendingPagination(newPagination);
      if (!searchParams?.has("_rsc")) {
        savePaginationState(
          String(newPagination.pageIndex + 1),
          String(newPagination.pageSize),
        );
      }
    },
    [pageIndex, pageSize, searchParams, savePaginationState, clientMode],
  );

  // Server-side sort: push `?sort=field,dir` (resetting to page 1) so the
  // backend reorders the whole dataset. Only active when `manualSort` is set.
  const handleSortingChange = React.useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      if (manualSort) {
        const first = next[0];
        const sortParam = first
          ? `${first.id},${first.desc ? "desc" : "asc"}`
          : null;
        const queryString = createQueryString({ sort: sortParam, page: 1 });
        router.replace(`${pathname}?${queryString}`, { scroll: false });
      }
    },
    [sorting, manualSort, createQueryString, router, pathname],
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [data]);

  // Seed the column filter from `?search=` so the visible input matches
  // the URL on first paint. Captured once on mount — subsequent edits
  // flow through the column's filter value and back into the URL via
  // the effect below.
  const initialColumnFilters = React.useMemo(() => {
    // Client-side mode owns search locally and shares routes with other
    // tables — don't seed from a `?search` that may belong to a sibling.
    if (clientMode) return [];
    const search = searchParams?.get("search");
    return search ? [{ id: searchKey, value: search }] : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const table = useReactTable({
    data: filteredData,
    columns,
    // Client-side mode lets the table derive the page count from the data;
    // server-side mode trusts the caller's count.
    pageCount: clientMode ? undefined : (pageCount ?? -1),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      columnFilters: initialColumnFilters,
    },
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
    },
    onPaginationChange: handlePaginationChange,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: !clientMode,
    manualFiltering: !clientMode,
    manualSorting: manualSort && !clientMode,
    enableRowSelection: true,
    onSortingChange:
      manualSort && !clientMode ? handleSortingChange : setSorting,
    getSortedRowModel: getSortedRowModel(),
  });

  const searchValue = table.getColumn(searchKey)?.getFilterValue() as string;

  // Push the typed search value to the URL after a 300 ms debounce.
  // No-op when the input already matches `?search=` — without this guard
  // every list page issued a redundant `?page=1&limit=N` round-trip
  // 300 ms after hydration, re-fetching the first page on every clean
  // visit. Page-size changes flow through the pagination effect above,
  // so they are intentionally not part of this effect.
  React.useEffect(() => {
    // Client-side search filters in-memory (no URL); hidden search can't type.
    if (!isInitialized || clientMode || hideSearch) return;

    const urlSearch = searchParams?.get("search") ?? "";
    const inputSearch = (searchValue ?? "").toString();

    if (urlSearch === inputSearch) return;

    const handle = setTimeout(() => {
      const queryString = createQueryString({
        page: 1,
        search: inputSearch.length > 0 ? inputSearch : null,
      });
      router.replace(`${pathname}?${queryString}`, { scroll: false });
    }, 300);

    return () => clearTimeout(handle);
  }, [searchValue, isInitialized, clientMode, hideSearch, searchParams, pathname, router, createQueryString]);

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
        <BulkArchive
          selectedIds={selectedRowIds}
          entityType={pageConfig.entityType as any}
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

  const totalRows = table.getFilteredRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = Math.max(1, table.getPageCount());

  // The toolbar carries the search box on the left and filter/import/export
  // actions on the right. With search hidden and nothing actionable, there's
  // nothing to render — drop the empty bar entirely (only reachable via the
  // opt-in `hideSearch`, so other pages are unaffected).
  const hasActions =
    !!(filterKey && filterOptions) ||
    !!(extraFilters && extraFilters.length > 0) ||
    !!pageConfig.importComponent ||
    !!pageConfig.exportComponent;
  const showToolbar = !hideSearch || hasActions;

  return (
    <motion.div className="space-y-3">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      {showToolbar && (
      <div className="flex flex-wrap items-center gap-2">
        {/* Search-box — design's pill-shaped input with the icon
            inside a hairline border on the card surface. */}
        {!hideSearch && (
        <div className="relative flex-1 md:max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-9 text-[12.5px]"
            placeholder={searchPlaceholder}
            type="search"
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
          />
        </div>
        )}

        {/* Desktop actions — lg and above */}
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {renderArchiveComponent()}

          {filterKey && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-dashed border-line-2 text-ink-3 hover:text-ink"
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {statusFilter
                      ? filterOptions.find((o) => o.value === statusFilter)
                          ?.label
                      : "Filter"}
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

          {extraFilters?.map((f) => {
            const active = extraFilterValues[f.key];
            const activeLabel = active
              ? f.options.find((o) => o.value === active)?.label
              : null;
            return (
              <DropdownMenu key={f.key}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-dashed border-line-2 text-ink-3 hover:text-ink"
                  >
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      {activeLabel ?? f.label}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{f.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {f.options.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={active === option.value}
                      onSelect={() => handleExtraFilterChange(f.key, option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}

          {pageConfig.importComponent}
          {pageConfig.exportComponent}
        </div>

        {/* Mobile / Tablet actions — below lg */}
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          {renderArchiveComponent()}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Actions
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
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
                  {((extraFilters && extraFilters.length > 0) ||
                    pageConfig.importComponent ||
                    pageConfig.exportComponent) && <DropdownMenuSeparator />}
                </>
              )}

              {extraFilters?.map((f, fIdx) => {
                const active = extraFilterValues[f.key];
                return (
                  <React.Fragment key={f.key}>
                    <DropdownMenuLabel>{f.label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {f.options.map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={active === option.value}
                        onSelect={() =>
                          handleExtraFilterChange(f.key, option.value)
                        }
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {(fIdx < extraFilters.length - 1 ||
                      pageConfig.importComponent ||
                      pageConfig.exportComponent) && <DropdownMenuSeparator />}
                  </React.Fragment>
                );
              })}

              {(pageConfig.importComponent || pageConfig.exportComponent) && (
                <>
                  <DropdownMenuLabel>Import & Export</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {pageConfig.importComponent && (
                    <div
                      className="flex flex-col gap-1 px-2 py-1"
                      // Prevent dropdown dismissing before dialog opens
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
      )}

      {/* ── Table + foot pager (single shell) ────────────────── */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-line bg-card">
          <Loading />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <Table>
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
                      onRowClick || rowClickBasePath ? "cursor-pointer" : ""
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
                    className="h-24 text-center text-muted-foreground"
                    colSpan={columns.length}
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Mono table-foot pager — consolidates pagination,
              rows-per-page, and selection summary into a single strip. */}
          <div className="flex flex-col items-stretch gap-2 border-t border-line bg-surface px-4 py-2.5 font-mono text-[11.5px] text-muted-foreground sm:flex-row sm:items-center">
            <div className="flex-1">
              {selectedRows > 0
                ? `${selectedRows} of ${totalRows} selected`
                : `Showing ${totalRows.toLocaleString()} row${totalRows === 1 ? "" : "s"}`}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Rows:</span>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-7 w-[60px] px-2 font-mono text-[11px]">
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

            {/* Pager — design's outline-square buttons. */}
            <div className="flex items-center gap-1">
              <PagerButton
                aria-label="First page"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <DoubleArrowLeftIcon className="h-3 w-3" />
              </PagerButton>
              <PagerButton
                aria-label="Previous page"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeftIcon className="h-3 w-3" />
              </PagerButton>
              <span className="px-2 tabular-nums text-ink-3">
                {currentPage} / {totalPages}
              </span>
              <PagerButton
                aria-label="Next page"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRightIcon className="h-3 w-3" />
              </PagerButton>
              <PagerButton
                aria-label="Last page"
                onClick={() => table.setPageIndex(totalPages - 1)}
                disabled={!table.getCanNextPage()}
              >
                <DoubleArrowRightIcon className="h-3 w-3" />
              </PagerButton>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Pager button — small mono outline square. Lives in the table-foot
 * pairing with `bg-surface` so it reads as part of the table card
 * instead of a separate row.
 */
function PagerButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={
        "grid h-7 w-7 place-items-center rounded-md border border-line bg-card text-ink-3 transition-colors hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card disabled:hover:text-ink-3 " +
        (className ?? "")
      }
      {...props}
    >
      {children}
    </button>
  );
}
