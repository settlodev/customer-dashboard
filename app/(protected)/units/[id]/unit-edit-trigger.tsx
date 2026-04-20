"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnitDialog } from "@/components/widgets/unit/unit-dialog";
import type { UnitOfMeasure } from "@/types/unit/type";

/**
 * Client wrapper so the server-rendered detail page can open the edit dialog
 * without becoming a client component itself.
 */
export function UnitEditTrigger({ unit }: { unit: UnitOfMeasure }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4 mr-1.5" />
        Edit
      </Button>
      <UnitDialog unit={unit} open={open} onOpenChange={setOpen} />
    </>
  );
}
