"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  Archive as ArchiveIcon,
  ArchiveRestore,
  MoreVertical,
  Pencil as EditIcon,
} from "lucide-react";

import DeleteModal from "@/components/tables/delete-modal";
import { deactivateStaff, reactivateStaff } from "@/lib/actions/staff-actions";
import { Staff } from "@/types/staff";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CellActionProps {
  data: Staff;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  const fullName = `${data.firstName} ${data.lastName}`;

  const handleDeactivate = async () => {
    try {
      const result = await deactivateStaff(data.id);
      if (result.responseType === "success") {
        toast({ title: "Deactivated", description: `${fullName} has been deactivated.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setArchiveModalOpen(false);
    }
  };

  const handleReactivate = async () => {
    setIsUnarchiving(true);
    try {
      const result = await reactivateStaff(data.id);
      if (result.responseType === "success") {
        toast({ title: "Reactivated", description: `${fullName} has been reactivated.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
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
          <DropdownMenuItem onClick={() => router.push(`/staff/${data.id}/edit`)}>
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {!data.owner && (
            <>
              <DropdownMenuSeparator />
              {!data.active ? (
                <DropdownMenuItem
                  onClick={handleReactivate}
                  disabled={isUnarchiving}
                  className="text-green-600 focus:text-green-600"
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  {isUnarchiving ? "Reactivating..." : "Reactivate"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setArchiveModalOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <ArchiveIcon className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal
        isOpen={isArchiveModalOpen}
        itemName={fullName}
        onDelete={handleDeactivate}
        onOpenChange={() => setArchiveModalOpen(false)}
      />
    </>
  );
};
