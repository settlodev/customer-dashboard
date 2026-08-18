"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FloorPlanDialog } from "@/components/forms/floor_plan_form";

interface AddFloorPlanButtonProps {
  variant?: "default" | "outline";
  label?: string;
}

export function AddFloorPlanButton({
  variant = "default",
  label = "Add floor plan",
}: AddFloorPlanButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant={variant}>
        <Plus className="mr-1.5 h-4 w-4" />
        {label}
      </Button>

      <FloorPlanDialog
        open={open}
        onOpenChange={setOpen}
        editingPlan={null}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
