"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  MoreVertical,
  Pencil as EditIcon,
  Archive as ArchiveIcon,
  ArchiveRestore,
  Trash2,
} from "lucide-react";

import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import { Brand } from "@/types/brand/type";
import {
  archiveBrand,
  unarchiveBrand,
  deleteBrand,
} from "@/lib/actions/brand-actions";
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
  data: Brand;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const result = await archiveBrand(data.id);
      if (result.responseType === "success") {
        toast({ variant: "success", title: "Archived", description: `${data.name} has been archived.` });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message || "Failed to archive brand" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Failed to archive brand" });
    } finally {
      setIsArchiving(false);
      setArchiveModalOpen(false);
    }
  };

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      const result = await unarchiveBrand(data.id);
      if (result.responseType === "success") {
        toast({ variant: "success", title: "Restored", description: `${data.name} has been restored.` });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message || "Failed to restore brand" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Failed to restore brand" });
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBrand(data.id);
      toast({ variant: "warning", title: "Deleted", description: `${data.name} has been permanently deleted.` });
      router.refresh();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Failed to delete brand" });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
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
          <DropdownMenuItem onClick={() => router.push(`/brands/${data.id}`)}>
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!data.archivedAt ? (
            <DropdownMenuItem onClick={() => setArchiveModalOpen(true)} className="text-red-600 focus:text-red-600">
              <ArchiveIcon className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={handleUnarchive} disabled={isUnarchiving} className="text-green-600 focus:text-green-600">
                <ArchiveRestore className="mr-2 h-4 w-4" />
                {isUnarchiving ? "Restoring..." : "Unarchive"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteModalOpen(true)} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete permanently
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal isOpen={isArchiveModalOpen} itemName={data.name} onDelete={handleArchive} onOpenChange={() => setArchiveModalOpen(false)} isLoading={isArchiving} />

      <Dialog open={isDeleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center">Delete {data.name}?</DialogTitle>
            <DialogDescription className="text-center">
              This action is permanent and cannot be undone. All associated data will be removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
