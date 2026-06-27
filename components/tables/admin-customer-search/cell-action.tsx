"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditCustomerDialog } from "@/components/admin/edit-customer-dialog";
import { AdminCustomerSearchItem } from "@/types/admin/account";

export function CustomerEditCell({
  customer,
}: {
  customer: AdminCustomerSearchItem;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <EditCustomerDialog
        customer={open ? customer : null}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
