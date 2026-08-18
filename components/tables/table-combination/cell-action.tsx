"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { MoreVertical, Pencil as EditIcon, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteModal from "@/components/tables/delete-modal";
import { CombinationDialog } from "@/components/forms/table_combination_form";
import { toast } from "@/hooks/use-toast";
import { Space, TableCombination } from "@/types/space/type";
import { deleteTableCombination } from "@/lib/actions/space-actions";
import { useBookableTables } from "@/components/widgets/table-combination/bookable-tables-context";

interface CellActionProps {
  data: TableCombination;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const bookableTables: Space[] = useBookableTables();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTableCombination(data.id);
      toast({
        variant: "success",
        title: "Deleted",
        description: `${data.name} has been deleted.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't delete",
        description:
          (error as Error).message ||
          "There was an issue with your request, please try again later.",
      });
    } finally {
      setIsDeleting(false);
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
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
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

      <CombinationDialog
        open={isEditOpen}
        onOpenChange={setEditOpen}
        editingCombination={data}
        bookableTables={bookableTables}
        onSaved={() => router.refresh()}
      />

      <DeleteModal
        isOpen={isDeleteOpen}
        itemName={data.name}
        onDelete={handleDelete}
        onOpenChange={() => setDeleteOpen(false)}
        isLoading={isDeleting}
      />
    </>
  );
};
