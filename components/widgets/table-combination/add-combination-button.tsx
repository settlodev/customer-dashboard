"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CombinationDialog } from "@/components/forms/table_combination_form";
import { Space } from "@/types/space/type";

interface AddCombinationButtonProps {
  bookableTables: Space[];
  variant?: "default" | "outline";
  label?: string;
}

export function AddCombinationButton({
  bookableTables,
  variant = "default",
  label = "Add combination",
}: AddCombinationButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant={variant}>
        <Plus className="mr-1.5 h-4 w-4" />
        {label}
      </Button>

      <CombinationDialog
        open={open}
        onOpenChange={setOpen}
        editingCombination={null}
        bookableTables={bookableTables}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
