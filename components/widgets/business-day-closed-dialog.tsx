"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2, PlayCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { openDaySession } from "@/lib/actions/location-day-sessions-actions";
import { DAY_SESSION_CHANGED_EVENT } from "@/components/widgets/day-session-widget";

interface BusinessDayClosedDialogProps {
  open: boolean;
  locationId?: string;
  reason?: string;
  onDismiss: () => void;
  onDayOpened: () => void;
}

export function BusinessDayClosedDialog({
  open,
  locationId,
  reason,
  onDismiss,
  onDayOpened,
}: BusinessDayClosedDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    if (!locationId) {
      setError("Pick a location first, then try again.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await openDaySession(locationId);
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Business day started",
          description: "Retrying your request…",
        });
        window.dispatchEvent(new CustomEvent(DAY_SESSION_CHANGED_EVENT));
        onDayOpened();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Business day is closed
          </DialogTitle>
          <DialogDescription>
            {reason ?? "No open business day at this location. Stock activity is blocked until the day is open."}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onDismiss} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={isPending}>
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            Start business day
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
