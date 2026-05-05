"use client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Plus, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { createCategory } from "@/lib/actions/category-actions";
import { fetchDepartmentsForCurrentLocation } from "@/lib/actions/department-actions";
import type { Category } from "@/types/category/type";
import type { Department } from "@/types/department/type";

interface Props {
  /** Render-prop or react node used as the dialog trigger. */
  trigger: React.ReactNode;
  /** Called with the freshly-created category on success. */
  onCreated: (category: Category) => void | Promise<void>;
  /** Disable the trigger from outside (e.g. while parent is busy). */
  disabled?: boolean;
}

/**
 * Lightweight "create one category, attach it where I am" dialog. Mirrors
 * the inline create flow of {@link components/widgets/category-selector}
 * but exposes it as a standalone widget so we can drop it next to any
 * MultiSelect / picker that should otherwise have to navigate away.
 *
 * Locations with multiple departments fall back to the full /categories
 * page — categories require a departmentId server-side and we don't want
 * to make the merchant guess from a tiny dialog.
 */
export default function CreateCategoryDialog({
  trigger,
  onCreated,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [defaultDepartmentId, setDefaultDepartmentId] = useState<string | null>(
    null,
  );
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    if (!open || departmentsLoaded) return;
    let cancelled = false;
    fetchDepartmentsForCurrentLocation(true)
      .then((depts: Department[]) => {
        if (cancelled) return;
        const preferred =
          depts.find((d) => d.isDefault) ??
          (depts.length === 1 ? depts[0] : null);
        setDefaultDepartmentId(preferred?.id ?? null);
        setDepartmentsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setDefaultDepartmentId(null);
        setDepartmentsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, departmentsLoaded]);

  const reset = () => {
    setName("");
    setError(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);

    if (!defaultDepartmentId) {
      setError(
        "This location has multiple departments. Open the full Categories page to pick one.",
      );
      return;
    }

    startTransition(async () => {
      const result = await createCategory(
        {
          name: trimmed,
          active: true,
          imageUrl: "",
          parentId: undefined,
          departmentId: defaultDepartmentId,
        },
        pathname ?? "",
      );
      if (result.responseType === "success" && result.data) {
        toast({ title: "Category created", description: trimmed });
        await onCreated(result.data);
        setOpen(false);
        reset();
      } else {
        setError(result.message ?? "Could not create category");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild disabled={disabled}>
        {trigger}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        overlayClassName="bg-foreground/30 backdrop-blur-sm"
      >
        <DialogHeader className="space-y-1.5 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Tag className="h-3.5 w-3.5" />
            </span>
            New category
          </DialogTitle>
          <DialogDescription className="text-xs">
            Give it a name to attach it here. You can refine the image,
            parent, and department later from the Categories page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="new-category-name"
                className="text-xs font-medium text-muted-foreground"
              >
                CATEGORY NAME
              </Label>
              <Input
                id="new-category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beverages"
                disabled={isPending}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
            {!departmentsLoaded && open && (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading department settings…
              </p>
            )}
          </div>

          <DialogFooter className="border-t bg-muted/30 px-6 py-3 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isPending ||
                !name.trim() ||
                !departmentsLoaded ||
                !defaultDepartmentId
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create category
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
