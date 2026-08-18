"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GroupDialog } from "@/components/forms/customer_group_form";

interface AddGroupButtonProps {
  variant?: "default" | "outline";
  label?: string;
}

export function AddGroupButton({
  variant = "default",
  label = "Add Group",
}: AddGroupButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant={variant}>
        <Plus className="mr-1.5 h-4 w-4" />
        {label}
      </Button>

      <GroupDialog
        open={open}
        onOpenChange={setOpen}
        editingGroup={null}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
