"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, Building2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { MergedCustomerPage } from "@/types/admin/account";

interface MergedCustomersViewProps {
  initialSearch: string;
  initialPage: MergedCustomerPage | null;
  error: string | null;
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

export function MergedCustomersView({
  initialSearch,
  initialPage,
  error,
}: MergedCustomersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState(initialSearch);

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const queryString = next.toString();
      startTransition(() => {
        router.push(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: input.trim() || null, page: null });
  };

  const goToPage = (page: number) =>
    updateParams({ page: page > 0 ? String(page) : null });

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 md:flex-row md:items-center"
      >
        <div className="relative flex-1 md:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by name, phone, email…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          Search
        </Button>
        {initialSearch && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setInput("");
              updateParams({ search: null, page: null });
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {initialPage && (
        <>
          <p className="font-mono text-[12px] text-muted-foreground">
            {initialPage.totalElements.toLocaleString()} unique customer
            {initialPage.totalElements === 1 ? "" : "s"}
            {initialSearch
              ? ` matching "${initialSearch}"`
              : " across all businesses"}{" "}
            · merged by phone / email
          </p>

          {initialPage.totalElements > 0 ? (
            <div className="overflow-hidden rounded-lg border border-line">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Businesses</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Last seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialPage.content.map((c) => (
                    <TableRow key={c.mergeKey}>
                      <TableCell>
                        <span className="font-medium text-ink">
                          {c.name || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {c.phone || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {c.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          {c.businessCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-muted-foreground">
                        {c.recordCount}
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-muted-foreground">
                        {formatDate(c.lastSeen)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No customers found.
              </p>
            </div>
          )}

          {initialPage.totalPages > 1 && (
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[12px] text-muted-foreground">
                Page {initialPage.page + 1} of {initialPage.totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(initialPage.page - 1)}
                  disabled={initialPage.page <= 0 || isPending}
                >
                  <ArrowLeftIcon className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(initialPage.page + 1)}
                  disabled={
                    initialPage.page + 1 >= initialPage.totalPages || isPending
                  }
                >
                  Next
                  <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
