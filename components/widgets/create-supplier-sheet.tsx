"use client";

import React, { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import SupplierForm from "@/components/forms/supplier-form";
import type { Supplier } from "@/types/supplier/type";

interface Props {
  /** Render-prop or react node used as the sheet trigger. */
  trigger: React.ReactNode;
  /** Called with the freshly-created supplier on success. */
  onCreated: (supplier: Supplier) => void | Promise<void>;
  /** Disable the trigger from outside (e.g. while parent is busy). */
  disabled?: boolean;
}

/**
 * "Create a supplier without leaving this page" — opens the real
 * {@link SupplierForm} (every field, not just the required ones) in a
 * right-side sheet instead of navigating to /suppliers/new. SupplierForm's
 * `onCreated`/`onCancel` props make it close the sheet and hand back the
 * new supplier instead of pushing to its detail page.
 */
export default function CreateSupplierSheet({
  trigger,
  onCreated,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild disabled={disabled}>
        {trigger}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-4 sm:max-w-2xl"
        overlayClassName="bg-foreground/30 backdrop-blur-sm"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>New supplier</SheetTitle>
          <SheetDescription>
            Every field from the full Suppliers page is here — fill in what
            you need and get back to your purchase order.
          </SheetDescription>
        </SheetHeader>
        <SupplierForm
          item={null}
          onCreated={async (supplier) => {
            await onCreated(supplier);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
