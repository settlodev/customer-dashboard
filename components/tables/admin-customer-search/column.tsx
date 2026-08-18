"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { CustomerEditCell } from "@/components/tables/admin-customer-search/cell-action";
import { AdminCustomerSearchItem } from "@/types/admin/account";

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

export function buildCustomerSearchColumns({
  canEdit,
}: {
  canEdit: boolean;
}): ColumnDef<AdminCustomerSearchItem>[] {
  const columns: ColumnDef<AdminCustomerSearchItem>[] = [
    {
      accessorKey: "fullName",
      enableHiding: false,
      header: "Customer",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-ink">
              {c.fullName ||
                `${c.firstName} ${c.lastName}`.trim() ||
                "—"}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {c.customerAccountNumber || c.id}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-mono text-[12px]">
          {row.original.phoneNumber || "—"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-mono text-[12px]">
          {row.original.email || "—"}
        </span>
      ),
    },
    {
      id: "account",
      header: "Account",
      cell: ({ row }) => (
        <Link
          href={`/accounts/${row.original.accountId}`}
          data-no-row-click
          className="font-mono text-[12px] text-primary hover:underline"
        >
          View account
        </Link>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.active
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
              : "border-muted bg-muted text-muted-foreground"
          }
        >
          {row.original.active ? "Active" : "Archived"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  if (canEdit) {
    columns.push({
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end" data-no-row-click>
          <CustomerEditCell customer={row.original} />
        </div>
      ),
    });
  }

  return columns;
}
