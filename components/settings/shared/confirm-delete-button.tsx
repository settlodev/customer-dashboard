"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Row-level delete with the standard danger confirmation. Every settings list
 * deletes through this rather than firing straight from the click, so no
 * destructive row action is one stray tap away.
 */
export function ConfirmDeleteButton({
  onConfirm,
  title,
  description,
  disabled,
  confirmLabel = "Delete",
  label,
  className,
}: {
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  disabled?: boolean;
  confirmLabel?: string;
  /** Render a labelled button instead of the icon-only default. */
  label?: string;
  className?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={label ? "sm" : "iconSm"}
          disabled={disabled}
          aria-label={label ?? title}
          title={label ?? title}
          className={cn("text-muted-foreground hover:bg-neg-tint hover:text-neg", className)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent tone="danger">
        <AlertDialogIcon>
          <Trash2 className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
