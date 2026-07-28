import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

interface ArchieveModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onArchieve: () => void;
  itemName: string;
}

export default function ArchieveModal({
  isOpen,
  onOpenChange,
  onArchieve,
  itemName,
}: ArchieveModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Archiving</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            Are you sure you want to archieve{" "}
            <span className="font-bold text-destructive">{itemName}</span>{" "}
            ?
            <br />
          </p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange()}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onArchieve}>
            Archieve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
