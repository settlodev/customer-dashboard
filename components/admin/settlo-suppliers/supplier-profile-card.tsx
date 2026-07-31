"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/admin/shared/section-card";
import { DefList, DefRow } from "@/components/admin/shared/def-list";
import { formatDateTime } from "@/components/admin/shared/format";
import { SupplierFormDialog } from "@/components/admin/settlo-suppliers/supplier-form-dialog";
import type { AdminSettloSupplier } from "@/types/admin/settlo-suppliers";

interface SupplierProfileCardProps {
  supplier: AdminSettloSupplier;
  canManage: boolean;
}

/**
 * SupplierProfileCard — the left-column profile card on the supplier detail
 * page. A thin client wrapper around `SectionCard` + `DefList` whose only
 * job is owning the `SupplierFormDialog` open state for the Edit button;
 * the page itself stays a server component.
 */
export function SupplierProfileCard({
  supplier,
  canManage,
}: SupplierProfileCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <SectionCard
        title="Profile"
        action={
          canManage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          ) : undefined
        }
      >
        <DefList>
          <DefRow label="Contact person" value={supplier.contactPerson ?? "—"} />
          <DefRow label="Phone" value={supplier.phone ?? "—"} />
          <DefRow label="Email" value={supplier.email ?? "—"} />
          <DefRow label="Address" value={supplier.address ?? "—"} />
          <DefRow
            label="City / Country"
            value={
              [supplier.city, supplier.country].filter(Boolean).join(", ") ||
              "—"
            }
          />
          <DefRow
            label="Registration number"
            value={supplier.registrationNumber ?? "—"}
          />
          <DefRow label="TIN number" value={supplier.tinNumber ?? "—"} />
          <DefRow label="Created" value={formatDateTime(supplier.createdAt)} />
        </DefList>
      </SectionCard>

      {canManage && (
        <SupplierFormDialog
          supplier={supplier}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}
