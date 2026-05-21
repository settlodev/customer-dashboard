"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, MapPin, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

import { AdminBusinessPage } from "@/types/admin/business";
import { BusinessLifecycleSnapshot } from "@/types/admin/business-intel";

interface BusinessesListViewProps {
  initialPage: AdminBusinessPage;
  initialSearch: string;
  initialStatus: string;
  accountId: string | null;
  lifecycleByBusinessId: Record<string, BusinessLifecycleSnapshot>;
}

function formatRelativeFromDays(days: number | null | undefined): string {
  if (days === null || days === undefined) return "—";
  if (days < 1) return "Today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

interface ActivityIndicator {
  label: string;
  className: string;
  hint: string;
}

function activityIndicator(
  lifecycle: BusinessLifecycleSnapshot | undefined,
): ActivityIndicator {
  if (!lifecycle) {
    return {
      label: "No data",
      className: "border-muted bg-muted text-muted-foreground",
      hint: "No lifecycle rollup row yet",
    };
  }
  const stage = (lifecycle.lifecycle_stage ?? "").toUpperCase();
  const days = lifecycle.days_since_last_order;
  if (lifecycle.is_churned === 1 || stage === "CHURNED") {
    return {
      label: "Churned",
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
      hint: "Marked churned in lifecycle rollup",
    };
  }
  if (days === null || days === undefined) {
    if (stage === "BUSINESS_CREATED") {
      return {
        label: "No orders",
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
        hint: "Business created, but no orders yet",
      };
    }
    return {
      label: "Unknown",
      className: "border-muted bg-muted text-muted-foreground",
      hint: "Last-order timestamp unavailable",
    };
  }
  if (days <= 7) {
    return {
      label: "Active",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
      hint: `Last order ${days}d ago`,
    };
  }
  if (days <= 30) {
    return {
      label: "Slowing",
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
      hint: `Last order ${days}d ago`,
    };
  }
  if (days <= 60) {
    return {
      label: "Stale",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      hint: `Last order ${days}d ago`,
    };
  }
  return {
    label: "Dormant",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
    hint: `Last order ${days}d ago`,
  };
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms = 350,
): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function BusinessesListView({
  initialPage,
  initialSearch,
  initialStatus,
  accountId,
  lifecycleByBusinessId,
}: BusinessesListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initialSearch);

  const updateParams = useCallback(
    (changes: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const queryString = next.toString();
      startTransition(() => {
        router.push(
          queryString ? `${pathname}?${queryString}` : pathname,
          { scroll: false },
        );
      });
    },
    [pathname, router, searchParams],
  );

  const pushSearch = useMemo(
    () =>
      debounce((value: string) => {
        updateParams({ search: value || null, page: null });
      }, 350),
    [updateParams],
  );

  useEffect(() => {
    pushSearch(searchInput.trim());
  }, [searchInput, pushSearch]);

  const handleStatusChange = (value: string) => {
    updateParams({ status: value === "all" ? null : value, page: null });
  };

  const goToPage = (page: number) => {
    updateParams({ page: page > 0 ? String(page) : null });
  };

  const clearAccountFilter = () => {
    updateParams({ accountId: null, page: null });
  };

  const { content, totalElements, totalPages, number, first, last, size } =
    initialPage;
  const fromIndex = number * size + 1;
  const toIndex = Math.min((number + 1) * size, totalElements);

  return (
    <div className="space-y-4">
      {accountId && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-canvas/40 px-3 py-2">
          <p className="font-mono text-[12px] text-muted-foreground">
            Filtered to account: {accountId}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAccountFilter}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, identifier…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={initialStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <p className="ml-auto font-mono text-[12px] text-muted-foreground">
          {totalElements === 0
            ? "No businesses"
            : `${fromIndex}–${toIndex} of ${totalElements}`}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Last order</TableHead>
              <TableHead className="text-right">Locations</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No businesses match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              content.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/businesses/${b.id}`}
                        className="font-medium text-ink hover:text-primary"
                      >
                        {b.name}
                      </Link>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {b.identifier}
                        {b.email ? ` · ${b.email}` : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/accounts/${b.accountId}`}
                      className="flex flex-col hover:text-primary"
                    >
                      <span className="text-[13px] text-ink">
                        {b.accountFullName ?? "—"}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {b.accountEmail ?? b.accountNumber ?? ""}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        b.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                          : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                      }
                    >
                      {b.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {(() => {
                    const lifecycle = lifecycleByBusinessId[b.id];
                    const indicator = activityIndicator(lifecycle);
                    return (
                      <>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={indicator.className}
                            title={indicator.hint}
                          >
                            {indicator.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-muted-foreground">
                          {lifecycle?.days_since_last_order !== undefined &&
                          lifecycle?.days_since_last_order !== null
                            ? formatRelativeFromDays(
                                lifecycle.days_since_last_order,
                              )
                            : "—"}
                        </TableCell>
                      </>
                    );
                  })()}
                  <TableCell className="text-right font-mono text-[12px] tabular-nums">
                    {b.activeLocationCount}
                    {b.locationCount !== b.activeLocationCount && (
                      <span className="text-muted-foreground">
                        {" "}
                        / {b.locationCount}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {b.region ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {b.region}
                        {b.district ? `, ${b.district}` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[12px]">
                    {b.baseCurrency}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">
                    {formatDate(b.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[12px] text-muted-foreground">
            Page {number + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(number - 1)}
              disabled={first || isPending}
            >
              <ArrowLeftIcon className="mr-1 h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(number + 1)}
              disabled={last || isPending}
            >
              Next
              <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
