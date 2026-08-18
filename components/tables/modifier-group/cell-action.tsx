"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  MoreVertical,
  Eye,
  Pencil as EditIcon,
  Archive as ArchiveIcon,
  ArchiveRestore,
  Trash2,
} from "lucide-react";

import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import type { ModifierGroup } from "@/types/product/type";
import {
  archiveModifierGroup,
  unarchiveModifierGroup,
  deleteModifierGroup,
} from "@/lib/actions/modifier-actions";
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
  data: ModifierGroup;
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
      await archiveModifierGroup(data.id);
      toast({
        variant: "success",
        title: "Archived",
        description: `${data.name} has been archived.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as Error).message || "Failed to archive modifier group",
      });
    } finally {
      setIsArchiving(false);
      setArchiveModalOpen(false);
    }
  };

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      await unarchiveModifierGroup(data.id);
      toast({
        variant: "success",
        title: "Restored",
        description: `${data.name} has been restored.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as Error).message || "Failed to restore modifier group",
      });
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteModifierGroup(data.id);
      toast({
        variant: "warning",
        title: "Deleted",
        description: `${data.name} has been permanently deleted.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as Error).message || "Failed to delete modifier group",
      });
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
          <DropdownMenuItem
            onClick={() => router.push(`/modifier-groups/${data.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/modifier-groups/${data.id}/edit`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!data.archivedAt ? (
            <DropdownMenuItem
              onClick={() => setArchiveModalOpen(true)}
              className="text-red-600 focus:text-red-600"
            >
              <ArchiveIcon className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onClick={handleUnarchive}
                disabled={isUnarchiving}
                className="text-green-600 focus:text-green-600"
              >
                <ArchiveRestore className="mr-2 h-4 w-4" />
                {isUnarchiving ? "Restoring..." : "Unarchive"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteModalOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete permanently
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal
        isOpen={isArchiveModalOpen}
        itemName={data.name}
        onDelete={handleArchive}
        onOpenChange={() => setArchiveModalOpen(false)}
        isLoading={isArchiving}
      />

      <Dialog open={isDeleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center">
              Delete {data.name}?
            </DialogTitle>
            <DialogDescription className="text-center">
              This action is permanent and detaches the group from every product
              that uses it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
