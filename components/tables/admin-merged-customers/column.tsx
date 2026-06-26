"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MergedCustomerRow } from "@/types/admin/account";

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

export function buildMergedCustomerColumns(): ColumnDef<MergedCustomerRow>[] {
  return [
    {
      accessorKey: "name",
      enableHiding: false,
      header: "Customer",
      cell: ({ row }) => (
        <span className="font-medium text-ink">{row.original.name || "—"}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-mono text-[12px]">{row.original.phone || "—"}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-mono text-[12px]">{row.original.email || "—"}</span>
      ),
    },
    {
      accessorKey: "businessCount",
      header: "Businesses",
      cell: ({ row }) => (
        <Badge variant="outline" className="gap-1">
          <Building2 className="h-3 w-3" />
          {row.original.businessCount}
        </Badge>
      ),
    },
    {
      accessorKey: "recordCount",
      header: "Records",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {row.original.recordCount}
        </span>
      ),
    },
    {
      accessorKey: "lastSeen",
      header: "Last seen",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatDate(row.original.lastSeen)}
        </span>
      ),
    },
  ];
}
