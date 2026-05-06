"use client";

import {
  Eye,
  MoreVertical,
  Pencil as EditIcon,
  Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useDisclosure } from "@/hooks/use-disclosure";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteModal from "@/components/tables/delete-modal";
import { Space } from "@/types/space/type";
import { toast } from "@/hooks/use-toast";
import { deleteSpace } from "@/lib/actions/space-actions";

interface CellActionProps {
  data: Space;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const onDelete = async () => {
    try {
      await deleteSpace(data.id);
      toast({
        variant: "success",
        title: "Deleted",
        description: `${data.name} has been deleted.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't delete",
        description:
          (error as Error).message ||
          "There was an issue with your request, please try again later.",
      });
    } finally {
      onOpenChange();
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Actions</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/spaces/${data.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/spaces/${data.id}/edit`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onOpen}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal
        isOpen={isOpen}
        itemName={data.name}
        onDelete={onDelete}
        onOpenChange={onOpenChange}
      />
    </>
  );
};
