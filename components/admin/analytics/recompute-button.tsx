"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

interface RecomputeButtonProps {
  label: string;
  description: string;
  action: () => Promise<{ status: string }>;
}

export function RecomputeButton({
  label,
  description,
  action,
}: RecomputeButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError("");
    startTransition(async () => {
      try {
        await action();
        toast({
          title: "Recompute triggered",
          description: `${label} job started. Data will refresh shortly.`,
        });
        setOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Recompute failed.");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        Recompute
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent tone="warning">
          <AlertDialogIcon>
            <RefreshCw className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>Recompute {label.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>

          {error && <FormError message={error} />}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Triggering…
                </span>
              ) : (
                "Recompute"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
