"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  ArchiveRestore,
  Eye,
  MoreVertical,
  Pencil as EditIcon,
  UserMinus,
} from "lucide-react";

import DeleteModal from "@/components/tables/delete-modal";
import { deactivateStaff, reactivateStaff } from "@/lib/actions/staff-actions";
import { invalidateStaffCache } from "@/lib/cache/reference-data";
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
  const [isDeactivateOpen, setDeactivateOpen] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const fullName = `${data.firstName} ${data.lastName}`;

  const handleDeactivate = async () => {
    try {
      const result = await deactivateStaff(data.id);
      if (result.responseType === "success") {
        invalidateStaffCache();
        toast({
          title: "Deactivated",
          description: `${fullName} has been deactivated.`,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't deactivate",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't deactivate",
        description: (error as Error).message,
      });
    } finally {
      setDeactivateOpen(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const result = await reactivateStaff(data.id);
      if (result.responseType === "success") {
        invalidateStaffCache();
        toast({
          title: "Reactivated",
          description: `${fullName} is back on roster.`,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't reactivate",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't reactivate",
        description: (error as Error).message,
      });
    } finally {
      setIsReactivating(false);
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
          <DropdownMenuItem onClick={() => router.push(`/staff/${data.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
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
                  disabled={isReactivating}
                  className="text-emerald-600 focus:text-emerald-600"
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  {isReactivating ? "Reactivating…" : "Reactivate"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setDeactivateOpen(true)}
                  className="text-amber-600 focus:text-amber-600"
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal
        isOpen={isDeactivateOpen}
        itemName={fullName}
        onDelete={handleDeactivate}
        onOpenChange={() => setDeactivateOpen(false)}
      />
    </>
  );
};
