"use client";

import { Edit, KeyRound, MoreHorizontal, Trash } from "lucide-react";
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
import DeleteModal from "@/components/tables/delete-modal";
import { deleteStaff, resetStaffPasscode } from "@/lib/actions/staff-actions";
import { Staff } from "@/types/staff";
import { toast } from "@/hooks/use-toast";
import { UUID } from "crypto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Import Dialog components from shadcn

interface CellActionProps {
  data: Staff;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = React.useState(false);

  const onDelete = async () => {
    try {
      if (data) {
        await deleteStaff(data.id);
        toast({
          variant: "default",
          title: "Success",
          description: "Staff deleted successfully!",
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
      setIsDeleteModalOpen(false);
    }
  };

  const handleResetPasscode = async (staffId: string) => {
    try {
      await resetStaffPasscode(staffId as UUID);
      toast({
        title: "Success",
        description: "Staff passcode has been reset",
        variant: "default",
      });
    }  catch (error: any) {
      const errorMessage = error?.response?.data?.message  
        || error?.message  
        || "Failed to reset staff passcode";  

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResetModalOpen(false);
    }
  };

  return (
    <>
      <div className="relative flex items-center gap-2">
        {/* Reset Passcode Button */}
        <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <KeyRound className="h-4 w-4" />
              <span className="sr-only">Reset Passcode</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Passcode</DialogTitle>
              <DialogDescription>
                Would you like to reset the passcode for this staff?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsResetModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => handleResetPasscode(data.id)}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Actions Dropdown Menu */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <span className="sr-only">Actions</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/staff/${data.id}`)}>
              <Edit className="mr-2 h-4 w-4" /> Update
            </DropdownMenuItem>
            {data.canDelete && (
              <>
                <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Modal */}
      {data.canDelete && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          itemName={data.firstName + " " + data.lastName}
          onDelete={onDelete}
          onOpenChange={() => setIsDeleteModalOpen(!isDeleteModalOpen)}
        />
      )}
    </>
  );
};