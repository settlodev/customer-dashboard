"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  MoreHorizontal,
  Trash2,
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
  archiveUnit,
  deleteUnit,
  unarchiveUnit,
} from "@/lib/actions/unit-actions";
import type { UnitOfMeasure } from "@/types/unit/type";

/**
 * Archive / restore / delete menu for a UoM. Entire menu hides for
 * system-generated units — the backend would reject these anyway, but the
 * user shouldn't even see the option.
 */
export function UnitStatusActions({ unit }: { unit: UnitOfMeasure }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (unit.systemGenerated) return null;

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
      const res = await deleteUnit(unit.id);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Deleted", description: res.message });
        router.push("/units");
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
        <DropdownMenuContent align="end" className="w-44">
          {unit.archivedAt ? (
            <DropdownMenuItem onClick={() => run(() => unarchiveUnit(unit.id))}>
              <ArchiveRestore className="h-4 w-4 mr-2" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => run(() => archiveUnit(unit.id))}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {unit.name}?</DialogTitle>
            <DialogDescription>
              Soft-deletes this unit. Stock that already references it stays
              intact, but you won&apos;t be able to assign new variants to it.
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
