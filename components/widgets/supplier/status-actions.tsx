"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  archiveSupplier,
  deleteSupplier,
  unarchiveSupplier,
} from "@/lib/actions/supplier-actions";
import type { Supplier } from "@/types/supplier/type";

/**
 * Header-level action menu for a supplier detail page. Keeps archive, restore,
 * and delete grouped so stakeholders don't have to hunt for the destructive
 * option, and gates delete behind an explicit confirm.
 */
export function SupplierStatusActions({ supplier }: { supplier: Supplier }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const run = (fn: () => Promise<{ responseType: string; message: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Done", description: res.message });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteSupplier(supplier.id);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Deleted", description: res.message });
        router.push("/suppliers");
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
        setConfirmDelete(false);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {supplier.archivedAt ? (
            <DropdownMenuItem onClick={() => run(() => unarchiveSupplier(supplier.id))}>
              <ArchiveRestore className="h-4 w-4 mr-2" />
              Restore supplier
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => run(() => archiveSupplier(supplier.id))}>
              <Archive className="h-4 w-4 mr-2" />
              Archive supplier
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete supplier
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {supplier.name}?</DialogTitle>
            <DialogDescription>
              This removes the supplier from your business. Historical GRNs,
              LPOs, and returns that reference them stay untouched, but you
              won&apos;t be able to assign new work to them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
