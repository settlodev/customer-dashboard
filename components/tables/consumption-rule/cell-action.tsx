"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { MoreVertical, Pencil as EditIcon, Trash2 } from "lucide-react";
import { useDisclosure } from "@/hooks/use-disclosure";
import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import { ConsumptionRule } from "@/types/consumption-rule/type";
import { deleteConsumptionRule } from "@/lib/actions/consumption-rule-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CellActionProps {
  data: ConsumptionRule;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const onDelete = async () => {
    try {
      await deleteConsumptionRule(data.id);
      toast({ title: "Deleted", description: `${data.name} has been deleted.` });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to delete consumption rule",
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
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/consumption-rules/${data.id}`)}>
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpen} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal isOpen={isOpen} itemName={data.name} onDelete={onDelete} onOpenChange={onOpenChange} />
    </>
  );
};
