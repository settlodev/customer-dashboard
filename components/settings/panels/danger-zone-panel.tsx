"use client";

import { useTransition } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { SettingsSection } from "../shared/settings-section";
import { resetLocationSettings } from "@/lib/actions/location-settings-actions";
import type { LocationSettings } from "@/types/location-settings/type";

export function DangerZonePanel({
  onReset,
}: {
  onReset: (next: LocationSettings) => void;
}) {
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
    });
  };

  return (
    <SettingsSection
      icon={<TriangleAlert className="h-4 w-4" />}
      tone="danger"
      title="Danger zone"
      description="Destructive actions. Take them only when you really mean to."
    >
      <div className="flex flex-col gap-3 rounded-lg border border-neg/30 bg-neg-tint p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink">
            Reset location settings to defaults
          </p>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
            Wipes every location-scoped toggle, threshold, receipt customisation,
            loyalty rule, and operating hour back to factory defaults. Accounting
            mappings, closure dates and payment methods are unaffected.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              className="w-full shrink-0 sm:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {isPending ? "Resetting…" : "Reset to defaults"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent tone="danger">
            <AlertDialogIcon>
              <RotateCcw className="h-5 w-5" />
            </AlertDialogIcon>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all location settings?</AlertDialogTitle>
              <AlertDialogDescription>
                This reverts every field on this page back to the system defaults.
                You can&apos;t undo it without entering each value manually again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep my settings</AlertDialogCancel>
              <AlertDialogAction onClick={confirmReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingsSection>
  );
}
