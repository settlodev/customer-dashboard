"use client";

import React, { useState, useTransition } from "react";
import { Award, Loader2, Plus } from "lucide-react";

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

import { createBrand } from "@/lib/actions/brand-actions";
import { invalidateBrandsCache } from "@/lib/cache/reference-data";
import type { Brand } from "@/types/brand/type";

interface Props {
  /** Render-prop or react node used as the dialog trigger. */
  trigger: React.ReactNode;
  /** Called with the freshly-created brand on success. */
  onCreated: (brand: Brand) => void | Promise<void>;
  /** Disable the trigger from outside (e.g. while parent is busy). */
  disabled?: boolean;
}

/**
 * Lightweight "create one brand, attach it where I am" dialog — the Brand
 * equivalent of {@link components/widgets/create-category-dialog}. Brands
 * have no department dependency, so unlike categories there's nothing to
 * resolve before submitting.
 */
export default function CreateBrandDialog({
  trigger,
  onCreated,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const reset = () => {
    setName("");
    setError(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);

    startTransition(async () => {
      const result = await createBrand({ name: trimmed });
      if (result?.responseType === "success" && result.data) {
        invalidateBrandsCache();
        toast({ title: "Brand created", description: trimmed });
        await onCreated(result.data);
        setOpen(false);
        reset();
      } else {
        setError(result?.message ?? "Could not create brand");
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
              <Award className="h-3.5 w-3.5" />
            </span>
            New brand
          </DialogTitle>
          <DialogDescription className="text-xs">
            Give it a name to attach it here. You can add a description and
            image later from the Brands page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="new-brand-name"
                className="text-xs font-medium text-muted-foreground"
              >
                BRAND NAME
              </Label>
              <Input
                id="new-brand-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coca-Cola"
                disabled={isPending}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
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
            <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create brand
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
