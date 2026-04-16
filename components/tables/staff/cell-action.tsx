"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  MoreVertical,
  Pencil as EditIcon,
  Archive as ArchiveIcon,
  ArchiveRestore,
  KeyRound,
} from "lucide-react";

import DeleteModal from "@/components/tables/delete-modal";
import { deactivateStaff, reactivateStaff, resetStaffPasscode } from "@/lib/actions/staff-actions";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CellActionProps {
  data: Staff;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  const fullName = `${data.firstName} ${data.lastName}`;

  const handleDeactivate = async () => {
    try {
      await deactivateStaff(data.id);
      toast({ title: "Deactivated", description: `${fullName} has been deactivated.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setArchiveModalOpen(false);
    }
  };

  const handleReactivate = async () => {
    setIsUnarchiving(true);
    try {
      await reactivateStaff(data.id);
      toast({ title: "Reactivated", description: `${fullName} has been reactivated.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleResetPasscode = async () => {
    try {
      await resetStaffPasscode(data.id);
      toast({ variant: "success", title: "Success", description: "Staff PIN has been reset." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error?.message || "Failed to reset PIN" });
    } finally {
      setResetModalOpen(false);
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
          {data.posAccess && (
            <DropdownMenuItem onClick={() => setResetModalOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Reset PIN
            </DropdownMenuItem>
          )}
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
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal
        isOpen={isArchiveModalOpen}
        itemName={fullName}
        onDelete={handleDeactivate}
        onOpenChange={() => setArchiveModalOpen(false)}
      />

      <Dialog open={isResetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset PIN</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the PIN for{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">{fullName}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPasscode}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
