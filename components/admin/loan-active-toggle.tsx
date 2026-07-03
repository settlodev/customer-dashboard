"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PauseCircle } from "lucide-react";

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
import {
  setFundingSourceActive,
  setLoanProductActive,
} from "@/lib/actions/admin/loans";

interface LoanActiveToggleProps {
  kind: "product" | "funding";
  id: string;
  name: string;
  active: boolean;
}

export function LoanActiveToggle({
  kind,
  id,
  name,
  active,
}: LoanActiveToggleProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const run = (next: boolean) =>
    startTransition(async () => {
      const res =
        kind === "product"
          ? await setLoanProductActive(id, next)
          : await setFundingSourceActive(id, next);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't update",
          description: res.message,
        });
        return;
      }
      toast({ title: res.message });
      setOpen(false);
      router.refresh();
    });

  if (!active) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-primary hover:text-primary"
        disabled={isPending}
        onClick={() => run(true)}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          "Reactivate"
        )}
      </Button>
    );
  }

  const scope =
    kind === "product" ? "new loan applications" : "new disbursements";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-neg"
        >
          Deactivate
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent tone="warning">
        <AlertDialogIcon>
          <PauseCircle className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            It won&apos;t be available for {scope} until you reactivate it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              run(false);
            }}
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Working…
              </span>
            ) : (
              "Deactivate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
