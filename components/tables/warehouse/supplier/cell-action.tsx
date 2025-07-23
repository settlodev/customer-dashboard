"use client";

import { Archive, Edit, MoreHorizontal} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {useDisclosure} from "@nextui-org/modal";
import {toast} from "@/hooks/use-toast";
import { Supplier } from "@/types/supplier/type";
import { archievSupplier} from "@/lib/actions/warehouse/supplier-actions";
import ArchieveModal from "../../archieve-modal";

interface CellActionProps {
  data: Supplier;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const onArchieve = async () => {
    try {
      if (data) {
        await archievSupplier(data.id);
        toast({
          variant: "default",
          title: "Success",
          description: "Supplier deleted successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description:
            "There was an issue with your request, please try again later",
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
      <div className="relative flex items-center gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <span className="sr-only">Actions</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/warehouse-suppliers/${data.id}`)}>
              <Edit className="mr-2 h-4 w-4" /> Update
            </DropdownMenuItem>
            {data.canDelete && (
              <>
                <DropdownMenuItem onClick={onOpen}>
                  <Archive className="mr-2 h-4 w-4" /> Archieve
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {data.canDelete && (
        <ArchieveModal
          isOpen={isOpen}
          itemName={data.name}
          onArchieve={onArchieve}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  );
};
