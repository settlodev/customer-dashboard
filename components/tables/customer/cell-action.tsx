"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  MoreVertical,
  Pencil as EditIcon,
  Archive as ArchiveIcon,
  ArchiveRestore,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import { Customer } from "@/types/customer/type";
import { archiveCustomer, unarchiveCustomer } from "@/lib/actions/customer-actions";

interface CellActionProps {
  data: Customer;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  const fullName = `${data.firstName} ${data.lastName}`;

  const handleArchive = async () => {
    try {
      await archiveCustomer(data.id);
      toast({
        title: "Archived",
        description: `${fullName} has been archived successfully.`,
      });
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

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      await unarchiveCustomer(data.id);
      toast({
        title: "Restored",
        description: `${fullName} has been restored successfully.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description:
          (error as Error).message ||
          "There was an issue with your request, please try again later",
      });
    } finally {
      setIsUnarchiving(false);
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
            onClick={() => router.push(`/customers/${data.id}/edit`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {data.isArchived ? (
            <DropdownMenuItem
              onClick={handleUnarchive}
              disabled={isUnarchiving}
              className="text-green-600 focus:text-green-600"
            >
              <ArchiveRestore className="mr-2 h-4 w-4" />
              {isUnarchiving ? "Restoring..." : "Unarchive"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setArchiveModalOpen(true)}
              className="text-red-600 focus:text-red-600"
            >
              <ArchiveIcon className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Confirmation Modal */}
      <DeleteModal
        isOpen={isArchiveModalOpen}
        itemName={fullName}
        onDelete={handleArchive}
        onOpenChange={() => setArchiveModalOpen(false)}
      />
    </>
  );
};
