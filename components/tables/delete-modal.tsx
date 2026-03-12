import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

interface DeleteModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onDelete: () => void;
  itemName: string;
}

export default function DeleteModal({
  isOpen,
  onOpenChange,
  onDelete,
  itemName,
}: DeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-bold text-destructive">{itemName}</span>{" "}
            ?
            <br />
            This action cannot be undone!
          </p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange()}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
