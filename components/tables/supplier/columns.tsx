"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Supplier } from "@/types/supplier/type";

export const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "name",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Supplier
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const { name, contactPersonName, linkedToSettloSupplier, settloSupplierName } =
        row.original;
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-sm font-semibold shrink-0">
            {name?.charAt(0)?.toUpperCase() || "S"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {name}
              </span>
              {linkedToSettloSupplier && (
                <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  Linked
                </span>
              )}
            </div>
            {contactPersonName && (
              <span className="text-xs text-muted-foreground block truncate">
                {contactPersonName}
                {settloSupplierName && linkedToSettloSupplier
                  ? ` · via ${settloSupplierName}`
                  : ""}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    enableHiding: true,
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.email || "\u2014"}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.phone || row.original.contactPersonPhone || "\u2014"}
      </span>
    ),
  },
  {
    accessorKey: "registrationNumber",
    header: "Reg #",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground">
        {row.original.registrationNumber || "\u2014"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isActive = !row.original.archivedAt;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {isActive ? "Active" : "Archived"}
        </span>
      );
    },
  },
];
