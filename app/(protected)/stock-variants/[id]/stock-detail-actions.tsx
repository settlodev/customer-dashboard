"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Trash2,
  AlertTriangle,
  MonitorSmartphone,
  MoreVertical,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Stock } from "@/types/stock/type";
import {
  archiveStock,
  unarchiveStock,
  deleteStock,
} from "@/lib/actions/stock-actions";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function StockDetailActions({ stock }: { stock: Stock }) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    setLoading(true);
    try {
      await archiveStock(stock.id);
      toast({ title: "Archived", description: `${stock.name} has been archived.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Failed to archive" });
    } finally {
      setLoading(false);
      setArchiveOpen(false);
    }
  };

  const handleUnarchive = async () => {
    setLoading(true);
    try {
      await unarchiveStock(stock.id);
      toast({ title: "Restored", description: `${stock.name} has been restored.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Failed to restore" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteStock(stock.id);
      toast({ title: "Deleted", description: `${stock.name} has been deleted.` });
      router.push("/stock-variants");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Failed to delete" });
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {stock.archived ? (
            <DropdownMenuItem onClick={handleUnarchive} disabled={loading}>
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Unarchive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setArchiveOpen(true)}
              className="text-amber-600 focus:text-amber-600"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive modal */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Archive className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-center">Archive {stock.name}?</DialogTitle>
            <DialogDescription className="text-center">
              This stock item and all its variants will be archived.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 my-2">
            <MonitorSmartphone className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This item will no longer appear on POS terminals. It can be restored later.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setArchiveOpen(false)} disabled={loading}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleArchive} disabled={loading}>
              <Archive className="h-4 w-4 mr-1.5" />
              {loading ? "Archiving..." : "Yes, Archive"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center">Delete {stock.name}?</DialogTitle>
            <DialogDescription className="text-center">
              This stock item and all its variants will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 my-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">
              This action cannot be undone. All variants and inventory balances will be removed.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              {loading ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
