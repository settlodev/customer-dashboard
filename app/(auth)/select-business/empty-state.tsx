"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { Building2, ChevronRight, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { switchAccount, type MeAccount } from "@/lib/actions/profile-actions";
import { Button } from "@/components/ui/button";

function accountInitials(name?: string | null) {
  if (!name) return "AC";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second =
    parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? "");
  return (first + second).toUpperCase() || "AC";
}

export function SelectBusinessEmptyState({
  others,
}: {
  others: MeAccount[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSwitch = async (account: MeAccount) => {
    if (pendingId !== null) return;
    setPendingId(account.id);
    try {
      const res = await switchAccount(account.id);
      if (res.responseType === "success") {
        // Hard nav so the re-minted token and cleared cookies take effect.
        window.location.href = "/select-business";
        return;
      }
      throw new Error(res.message || "Account switch failed");
    } catch (error) {
      Sentry.captureException(error);
      setPendingId(null);
      toast({
        variant: "destructive",
        title: "Couldn't switch account",
        description: "Please try again in a moment.",
      });
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          No business in this account yet
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Switch to an account you&apos;ve been invited to, or create a new
          business.
        </p>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto mb-6">
        {others.map((a) => {
          const isPending = pendingId === a.id;
          const isDisabled = pendingId !== null;
          return (
            <button
              key={a.id}
              onClick={() => handleSwitch(a)}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                isPending
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 font-mono text-[13px] font-medium tracking-wider text-primary">
                {accountInitials(a.name)}
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {a.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>
                    {a.owner ? "Owner" : "Member"}
                    {a.identifier ? ` · ${a.identifier}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {isPending ? (
                  <Loader2Icon className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = "/business-registration";
          }}
          disabled={pendingId !== null}
        >
          Create a new business
        </Button>
      </div>
    </div>
  );
}
