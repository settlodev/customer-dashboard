"use client";

import { Edit, MoreHorizontal} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
// import { useDisclosure } from "@nextui-org/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import DeleteModal from "@/components/tables/delete-modal";
// import { useToast } from "@/hooks/use-toast"
// import { deleteCategory } from "@/lib/actions/category-actions";
// import {Category} from "@/types/category/type";
import { Purchase } from "@/types/warehouse/purchase/type";
// import { deletePurchase } from "@/lib/actions/warehouse/purchases-action";

interface CellActionProps {
  data: Purchase;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  // const { isOpen, onOpen, onOpenChange } = useDisclosure();
  // const { toast } = useToast()

  // const onDelete = async () => {
  //   try {
  //     if (data) {
  //       await deletePurchase(data.id);
  //       toast({
  //         variant: "default",
  //         title: "Success",
  //         description: "Purchase deleted successfully!",
  //       });
  //     } else {
  //       toast({
  //         variant: "destructive",
  //         title: "Uh oh! Something went wrong.",
  //         description:
  //           "There was an issue with your request, please try again later",
  //       });
  //     }
  //   } catch (error) {
  //     toast({
  //       variant: "destructive",
  //       title: "Uh oh! Something went wrong.",
  //       description:
  //         (error as Error).message ||
  //         "There was an issue with your request, please try again later",
  //     });
  //   } finally {
  //     onOpenChange();
  //   }
  // };

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
            <DropdownMenuItem
              onClick={() => router.push(`/purchases/${data.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" /> Update
            </DropdownMenuItem>
            {/* {data.canDelete && (
              <>
                <DropdownMenuItem onClick={onOpen}>
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )} */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* {data.canDelete && (
        <DeleteModal
          isOpen={isOpen}
          itemName={data.name}
          onDelete={onDelete}
          onOpenChange={onOpenChange}
        />
      )} */}
    </>
  );
};
