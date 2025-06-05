"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { archiveEntity } from "@/lib/actions/archive-service";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

interface BulkArchiveProps {
  selectedIds: string[];
  entityType: 'product' | 'stock' | 'staff' |'stock-intake';
  onSuccess?: () => void;
  entityNameSingular?: string;
  entityNamePlural?: string;
}

export function BulkArchive({
  selectedIds,
  entityType,
  onSuccess,
  entityNameSingular,
  entityNamePlural,
}: BulkArchiveProps) {
  const [openArchiveDialog, setOpenArchiveDialog] = React.useState(false);
  const [archiveInProgress, setArchiveInProgress] = React.useState(false);

  // Format entity name for display (e.g., 'product' -> 'Product', 'stock' -> 'Stock')
  const displayName = {
    singular: entityNameSingular || entityType.charAt(0).toUpperCase() + entityType.slice(1),
    plural: entityNamePlural || entityType.charAt(0).toUpperCase() + entityType.slice(1) + 's'
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) {
      toast.error("No items selected for archiving");
      return;
    }

    try {
      setArchiveInProgress(true);

      const locationId = await getCurrentLocation();

      
      // Call the archive service
      const result = await archiveEntity({
        ids: selectedIds,
        entityType: entityType,
        locationId: locationId?.id
      });
      
      if (result.success) {
        toast.success(result.message);
        
        // Call onSuccess callback if provided
        if (onSuccess) onSuccess();
        
        // Close dialog
        setOpenArchiveDialog(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Failed to archive ${displayName.plural.toLowerCase()}`);
      console.error(error);
    } finally {
      setArchiveInProgress(false);
    }
  };

  // Only render if there are selected items
  if (selectedIds.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1"
        onClick={() => setOpenArchiveDialog(true)}
      >
        <Archive className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Archive
        </span>
      </Button>

      {/* Archive Confirmation Dialog */}
      <Dialog open={openArchiveDialog} onOpenChange={setOpenArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Selected {displayName.plural}</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive {selectedIds.length} selected {selectedIds.length === 1 ? displayName.singular.toLowerCase() : displayName.plural.toLowerCase()}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenArchiveDialog(false)} 
              disabled={archiveInProgress}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleBulkArchive}
              disabled={archiveInProgress}
            >
              {archiveInProgress ? "Archiving..." : `Archive ${selectedIds.length} ${selectedIds.length === 1 ? displayName.singular : displayName.plural}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}