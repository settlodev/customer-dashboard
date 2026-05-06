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
import { useToast } from "@/hooks/use-toast";
import { Reservation } from "@/types/reservation/type";
import { deleteReservation } from "@/lib/actions/reservation-actions";

interface CellActionProps {
  data: Reservation;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { toast } = useToast();

  const onDelete = async () => {
    try {
      await deleteReservation(data.id);
      toast({
        variant: "success",
        title: "Deleted",
        description: "Reservation deleted successfully.",
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
          <DropdownMenuItem
            onClick={() => router.push(`/reservations/${data.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/reservations/${data.id}/edit`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {data.canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onOpen}
                className="text-red-600 focus:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {data.canDelete && (
        <DeleteModal
          isOpen={isOpen}
          itemName={data.customerName || "this reservation"}
          onDelete={onDelete}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  );
};
