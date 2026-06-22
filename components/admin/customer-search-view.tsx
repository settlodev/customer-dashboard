"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, Pencil, Search } from "lucide-react";

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

import {
  AdminCustomerSearchItem,
  AdminCustomerSearchPage,
} from "@/types/admin/account";
import { EditCustomerDialog } from "@/components/admin/edit-customer-dialog";

interface CustomerSearchViewProps {
  initialQuery: string;
  initialPage: AdminCustomerSearchPage | null;
  error: string | null;
  /** When true, each row gets an Edit action (gated to write roles). */
  canEdit?: boolean;
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
  const [editing, setEditing] = useState<AdminCustomerSearchItem | null>(null);

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
        router.push(
          queryString ? `${pathname}?${queryString}` : pathname,
          { scroll: false },
        );
      });
    },
    [pathname, router, searchParams],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    updateParams({ q: trimmed || null, page: null });
  };

  const goToPage = (page: number) => {
    updateParams({ page: page > 0 ? String(page) : null });
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
            <div className="overflow-hidden rounded-lg border border-line">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    {canEdit && <TableHead className="w-[1%]" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialPage.content.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-ink">
                            {customer.fullName ||
                              `${customer.firstName} ${customer.lastName}`.trim() ||
                              "—"}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {customer.customerAccountNumber || customer.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {customer.phoneNumber || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {customer.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/accounts/${customer.accountId}`}
                          className="font-mono text-[12px] text-primary hover:underline"
                        >
                          View account
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            customer.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                              : "border-muted bg-muted text-muted-foreground"
                          }
                        >
                          {customer.active ? "Active" : "Archived"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-muted-foreground">
                        {formatDate(customer.createdAt)}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(customer)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {initialPage.totalPages > 1 && (
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[12px] text-muted-foreground">
                Page {initialPage.number + 1} of {initialPage.totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(initialPage.number - 1)}
                  disabled={initialPage.first || isPending}
                >
                  <ArrowLeftIcon className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(initialPage.number + 1)}
                  disabled={initialPage.last || isPending}
                >
                  Next
                  <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}

      <EditCustomerDialog
        customer={editing}
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      />
    </div>
  );
}
