"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/tables/data-table";
import { buildMergedCustomerColumns } from "@/components/tables/admin-merged-customers/column";
import { MergedCustomerPage } from "@/types/admin/account";

interface MergedCustomersViewProps {
  initialSearch: string;
  initialPage: MergedCustomerPage | null;
  error: string | null;
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

  const columns = useMemo(() => buildMergedCustomerColumns(), []);

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
    updateParams({ search: input.trim() || null, page: null });
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

          <DataTable
            columns={columns}
            data={initialPage.content}
            searchKey="name"
            hideSearch
            pageNo={initialPage.page}
            total={initialPage.totalElements}
            pageCount={Math.max(1, initialPage.totalPages)}
            defaultPageSize={initialPage.size ?? 20}
            disableArchive
          />
        </>
      )}
    </div>
  );
}
