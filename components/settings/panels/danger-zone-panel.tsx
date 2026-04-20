"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SettingsSection } from "../shared/settings-section";
import { resetLocationSettings } from "@/lib/actions/location-settings-actions";
import type { LocationSettings } from "@/types/location-settings/type";

export function DangerZonePanel({
  onReset,
}: {
  onReset: (next: LocationSettings) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const confirmReset = () => {
    startTransition(async () => {
      const res = await resetLocationSettings();
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't reset",
          description: res.message,
        });
        return;
      }
      toast({ title: "Settings reset", description: res.message });
      if (res.data) onReset(res.data);
      setOpen(false);
    });
  };

  return (
    <SettingsSection
      title="Danger zone"
      description="Destructive actions. Take them only when you really mean to."
    >
      <div className="rounded-lg border border-red-200 bg-red-50/40 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-red-900">
            Reset location settings to defaults
          </p>
          <p className="text-xs text-red-800/80 mt-1">
            Wipes every location-scoped toggle, threshold, receipt customisation,
            loyalty rule, and operating hour back to factory defaults. Accounting
            mappings, closure dates and payment methods are unaffected.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reset to defaults
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset all location settings?</DialogTitle>
              <DialogDescription>
                This reverts every field on this page back to the system defaults.
                You can&apos;t undo it without entering each value manually again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
                Keep my settings
              </Button>
              <Button variant="destructive" onClick={confirmReset} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SettingsSection>
  );
}
