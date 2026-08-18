"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { SupplierStatusBadge } from "@/components/admin/settlo-suppliers/supplier-status-badge";
import { SupplierFormDialog } from "@/components/admin/settlo-suppliers/supplier-form-dialog";
import { cn } from "@/lib/utils";
import type { AdminSettloSupplier } from "@/types/admin/settlo-suppliers";

interface SettloSuppliersViewProps {
  suppliers: AdminSettloSupplier[];
  canManage: boolean;
}

function buildColumns(): ColumnDef<AdminSettloSupplier>[] {
  return [
    {
      accessorKey: "name",
      enableHiding: false,
      header: "Name",
      cell: ({ row }) => (
        <Link
          href={`/settlo-suppliers/${row.original.id}`}
          className="font-medium text-ink hover:text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "contactPerson",
      header: "Contact person",
      cell: ({ row }) => (
        <span className="text-[13px] text-ink-3">
          {row.original.contactPerson ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {row.original.phone ?? "—"}
        </span>
      ),
    },
    {
      id: "location",
      header: "City / Country",
      cell: ({ row }) => {
        const { city, country } = row.original;
        if (!city && !country) {
          return <span className="text-[13px] text-muted-foreground">—</span>;
        }
        return (
          <span className="text-[13px] text-ink-3">
            {[city, country].filter(Boolean).join(", ")}
          </span>
        );
      },
    },
    {
      accessorKey: "verificationStatus",
      header: "Status",
      cell: ({ row }) => (
        <SupplierStatusBadge status={row.original.verificationStatus} />
      ),
    },
    {
      accessorKey: "financingEligible",
      header: "Financing",
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[12.5px] font-medium",
            row.original.financingEligible ? "text-pos" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              row.original.financingEligible ? "bg-pos" : "bg-muted-foreground/40",
            )}
          />
          {row.original.financingEligible ? "Eligible" : "Not eligible"}
        </span>
      ),
    },
  ];
}

export function SettloSuppliersView({
  suppliers,
  canManage,
}: SettloSuppliersViewProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const columns = useMemo(() => buildColumns(), []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-[12px] text-muted-foreground">
          {suppliers.length === 0
            ? "No suppliers yet"
            : `${suppliers.length} supplier${suppliers.length === 1 ? "" : "s"}`}
        </p>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New supplier
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        searchKey="name"
        clientMode
        rowClickBasePath="/settlo-suppliers"
        disableArchive
      />

      {canManage && (
        <SupplierFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
