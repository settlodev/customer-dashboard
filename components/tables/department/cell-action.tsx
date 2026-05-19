"use client";

import { useRouter } from "next/navigation";
import React from "react";
import {
  MoreVertical,
  Eye as EyeIcon,
  Pencil as EditIcon,
  Archive as ArchiveIcon,
} from "lucide-react";
import { useDisclosure } from "@/hooks/use-disclosure";

import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import { deleteDepartment } from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CellActionProps {
  data: Department;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const onDelete = async () => {
    try {
      if (data) {
        await deleteDepartment(data.id);
        toast({
          title: "Archived",
          description: `${data.name} has been archived successfully.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description:
          (error as Error).message ||
          "There was an issue with your request, please try again later",
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
          <DropdownMenuItem
            onClick={() => router.push(`/departments/reports/${data.id}`)}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            View Report
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/departments/${data.id}`)}
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
                <ArchiveIcon className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {data.canDelete && (
        <DeleteModal
          isOpen={isOpen}
          itemName={data.name}
          onDelete={onDelete}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  );
};
