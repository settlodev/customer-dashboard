"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  MoreVertical,
  Pencil as EditIcon,
  Eye,
  Archive as ArchiveIcon,
  ArchiveRestore,
  Trash2,
} from "lucide-react";

import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import {
  archiveProduct,
  unarchiveProduct,
  deleteProduct,
  archiveVariant,
  unarchiveVariant,
  deleteVariant,
} from "@/lib/actions/product-actions";
import { Product } from "@/types/product/type";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CellActionProps {
  data: Product;
  /**
   * When supplied, archive/unarchive/delete operate on this specific
   * variant. Without it, the actions stay at the product level (legacy
   * detail-page usage). Edit and View always navigate to the product
   * because both operate on the parent product as a whole.
   */
  variant?: {
    id: string;
    name: string;
    archivedAt: string | null;
  };
}

export const CellAction: React.FC<CellActionProps> = ({ data, variant }) => {
  const router = useRouter();

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // When operating per-variant, the row's archived state reflects the
  // variant's own archive flag — independent of the parent product's
  // (the backend auto-archives the product only when ALL variants are).
  const isArchived = variant
    ? variant.archivedAt != null
    : data.archivedAt != null;

  const targetName = variant ? variant.name : data.name;

  const handleArchive = async () => {
    try {
      if (variant) {
        await archiveVariant(data.id, variant.id);
      } else {
        await archiveProduct(data.id);
      }
      toast({
        title: "Archived",
        description: `${targetName} has been archived.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to archive",
        description:
          (error as Error).message ||
          "There was an issue with your request, please try again.",
      });
    } finally {
      setArchiveOpen(false);
    }
  };

  const handleUnarchive = async () => {
    try {
      if (variant) {
        await unarchiveVariant(data.id, variant.id);
      } else {
        await unarchiveProduct(data.id);
      }
      toast({
        title: "Unarchived",
        description: `${targetName} is back in the catalog.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to unarchive",
        description: (error as Error).message || "Try again in a moment.",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (variant) {
        await deleteVariant(data.id, variant.id);
      } else {
        await deleteProduct(data.id);
      }
      toast({
        title: "Deleted",
        description: `${targetName} has been removed.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: (error as Error).message || "Try again in a moment.",
      });
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/products/${data.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/products/${data.id}/edit`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isArchived ? (
            <DropdownMenuItem
              onClick={handleUnarchive}
              className="text-emerald-600 focus:text-emerald-600"
            >
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Unarchive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setArchiveOpen(true)}
              className="text-amber-600 focus:text-amber-600"
            >
              <ArchiveIcon className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal
        isOpen={archiveOpen}
        itemName={targetName}
        onDelete={handleArchive}
        onOpenChange={() => setArchiveOpen(false)}
      />

      <DeleteModal
        isOpen={deleteOpen}
        itemName={targetName}
        onDelete={handleDelete}
        onOpenChange={() => setDeleteOpen(false)}
      />
    </>
  );
};
