"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  MoreVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  AlertTriangle,
  MonitorSmartphone,
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

interface CellActionProps {
  data: Stock;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    setLoading(true);
    try {
      await archiveStock(data.id);
      toast({
        title: "Archived",
        description: `${data.name} has been archived.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as Error).message || "Failed to archive stock item",
      });
    } finally {
      setLoading(false);
      setArchiveOpen(false);
    }
  };

  const handleUnarchive = async () => {
    setLoading(true);
    try {
      await unarchiveStock(data.id);
      toast({
        title: "Restored",
        description: `${data.name} has been restored.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as Error).message || "Failed to restore stock item",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteStock(data.id);
      toast({
        title: "Deleted",
        description: `${data.name} has been deleted.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as Error).message || "Failed to delete stock item",
      });
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/stock-variants/${data.id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {data.archived ? (
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

      {/* ── Archive confirmation ─────────────────────────────────── */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Archive className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-center">
              Archive {data.name}?
            </DialogTitle>
            <DialogDescription className="text-center">
              This stock item and all its variants will be archived.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
              <MonitorSmartphone className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Not visible on POS
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  This item will no longer appear on the point of sale
                  terminal and will not be available for new transactions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
              <ArchiveRestore className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Can be restored later
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Archived items can be unarchived at any time. Historical
                  data is preserved.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleArchive}
              disabled={loading}
            >
              <Archive className="h-4 w-4 mr-1.5" />
              {loading ? "Archiving..." : "Yes, Archive"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center">
              Delete {data.name}?
            </DialogTitle>
            <DialogDescription className="text-center">
              This stock item and all its variants will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  This action cannot be undone
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                  The stock item, all variants, and associated inventory
                  balances will be removed. If you only want to hide this
                  item, use Archive instead.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {loading ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
