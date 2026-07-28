import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Archive, MonitorSmartphone } from "lucide-react";

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
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
            <Archive className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center">
            Archive {itemName}?
          </DialogTitle>
          <DialogDescription className="text-center">
            This item will be hidden and no longer accessible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
            <MonitorSmartphone className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Not visible on POS
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                This item will no longer appear on the point of sale terminal
                and will not be available for new transactions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
            <AlertTriangle className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Existing records preserved
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Historical data such as past sales and reports will not be
                affected.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange()}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Archive className="h-4 w-4 mr-1.5" />
            Yes, Archive
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
