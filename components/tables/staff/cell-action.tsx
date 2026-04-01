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
import {
  deactivateStaff,
  reactivateStaff,
  resetStaffPasscode,
} from "@/lib/actions/staff-actions";
import { Staff } from "@/types/staff";
import { toast } from "@/hooks/use-toast";
import { UUID } from "crypto";
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

  const handleArchive = async () => {
    try {
      await deactivateStaff(data.id);
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
      await reactivateStaff(data.id);
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

  const handleResetPasscode = async () => {
    try {
      await resetStaffPasscode(data.id as UUID);
      toast({
        variant: "success",
        title: "Success",
        description: "Staff passcode has been reset.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to reset staff passcode",
      });
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
          <DropdownMenuItem
            onClick={() => router.push(`/staff/${data.id}/edit`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetModalOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Reset Passcode
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

      {/* Archive Modal */}
      <DeleteModal
        isOpen={isArchiveModalOpen}
        itemName={fullName}
        onDelete={handleArchive}
        onOpenChange={() => setArchiveModalOpen(false)}
      />

      {/* Reset Passcode Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Passcode</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the passcode for{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {fullName}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleResetPasscode}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
