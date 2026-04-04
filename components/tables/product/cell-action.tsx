"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  MoreVertical,
  Pencil as EditIcon,
  Archive as ArchiveIcon,
} from "lucide-react";

import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import { archiveProduct } from "@/lib/actions/product-actions";
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
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();

  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);

  const handleArchive = async () => {
    try {
      if (data) {
        await archiveProduct(data.id);
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
      setArchiveModalOpen(false);
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
          <DropdownMenuItem
            onClick={() => router.push(`/products/${data.id}/edit`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {data.canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setArchiveModalOpen(true)}
                className="text-amber-600 focus:text-amber-600"
              >
                <ArchiveIcon className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Modal */}
      {data.canDelete && (
        <DeleteModal
          isOpen={isArchiveModalOpen}
          itemName={data.name}
          onDelete={handleArchive}
          onOpenChange={() => setArchiveModalOpen(false)}
        />
      )}
    </>
  );
};
