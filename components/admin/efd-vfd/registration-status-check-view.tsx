"use client";

import { useTransition } from "react";
import { Loader2, RadioTower } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { runVfdRegistrationStatusCheck } from "@/lib/actions/admin/efd-vfd-actions";

interface Props {
  /** Whether the signed-in staff hold internal:vfd:trigger. */
  canExecute: boolean;
}

export function RegistrationStatusCheckView({ canExecute }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleRun = () => {
    startTransition(async () => {
      const result = await runVfdRegistrationStatusCheck();
      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Check failed",
          description: result.message,
        });
        return;
      }
      toast({ title: "Registration check complete", description: result.message });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RadioTower className="h-5 w-5" />
          Pending registration check
        </CardTitle>
        <CardDescription>
          Normally runs every 15 minutes. Forces an immediate re-check of
          every VFD registration still awaiting DIRM approval
          (externalStatus = &quot;Pending&quot;), re-attempting
          authentication for each.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          size="sm"
          disabled={!canExecute || isPending}
          onClick={handleRun}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking…
            </span>
          ) : (
            "Run now"
          )}
        </Button>
        {!canExecute && (
          <p className="mt-2 text-sm text-muted-foreground">
            You need the vfd-trigger permission to run this.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
