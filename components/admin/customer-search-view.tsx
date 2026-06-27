"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/tables/data-table";
import { buildCustomerSearchColumns } from "@/components/tables/admin-customer-search/column";
import { AdminCustomerSearchPage } from "@/types/admin/account";

interface CustomerSearchViewProps {
  initialQuery: string;
  initialPage: AdminCustomerSearchPage | null;
  error: string | null;
  /** When true, each row gets an Edit action (gated to write roles). */
  canEdit?: boolean;
}

export function CustomerSearchView({
  initialQuery,
  initialPage,
  error,
  canEdit = false,
}: CustomerSearchViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState(initialQuery);

  const columns = useMemo(
    () => buildCustomerSearchColumns({ canEdit }),
    [canEdit],
  );

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
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
    updateParams({ q: input.trim() || null, page: null });
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 md:flex-row md:items-center"
      >
        <div className="relative flex-1 md:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          Search
        </Button>
      </form>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {initialQuery.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Enter a search term to look up customers across all accounts.
          </p>
        </div>
      ) : initialPage ? (
        <>
          <p className="font-mono text-[12px] text-muted-foreground">
            {initialPage.totalElements === 0
              ? `No customers match "${initialQuery}"`
              : `${initialPage.totalElements} match${
                  initialPage.totalElements === 1 ? "" : "es"
                } for "${initialQuery}"`}
          </p>

          {initialPage.totalElements > 0 && (
            <DataTable
              columns={columns}
              data={initialPage.content}
              searchKey="fullName"
              hideSearch
              pageNo={initialPage.number}
              total={initialPage.totalElements}
              pageCount={Math.max(1, initialPage.totalPages)}
              defaultPageSize={initialPage.size ?? 20}
              disableArchive
            />
          )}
        </>
      ) : null}
    </div>
  );
}
