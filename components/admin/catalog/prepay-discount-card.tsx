"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { updatePrepayDiscount } from "@/lib/actions/admin/billing";
import type { BillingConfigResponse } from "@/types/admin/billing";

/**
 * The platform prepayment discount, switchable here rather than baked into
 * application.properties at boot.
 *
 * It applies to a 12-month-or-longer commitment ONLY — the previous quarterly (3+) and
 * semi-annual (6+) tiers were removed, and were being applied to every multi-month
 * invoice with no way to opt out.
 */
export function PrepayDiscountCard({
  config,
}: {
  config: BillingConfigResponse | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [enabled, setEnabled] = useState(!!config?.prepayDiscountEnabled);
  const [pct, setPct] = useState(String(config?.annualDiscountPct ?? 0));

  const parsed = Number(pct);
  const invalid = !Number.isFinite(parsed) || parsed < 0 || parsed > 100;
  const dirty =
    enabled !== !!config?.prepayDiscountEnabled ||
    parsed !== Number(config?.annualDiscountPct ?? 0);

  const save = () => {
    if (invalid) return;
    startTransition(async () => {
      const result = await updatePrepayDiscount(enabled, parsed);
      if (result.responseType === "error") {
        toast({
          title: "Couldn't update the prepay discount",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-canvas text-ink-3">
            <TicketPercent className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Prepay discount</p>
            <p className="mt-0.5 max-w-xl text-[12.5px] leading-relaxed text-muted-foreground">
              Applies to commitments of <strong>12 months or longer</strong> only.
              Shorter terms always bill gross. While this is off, nothing is
              discounted at any term.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[12.5px] font-medium text-ink-2">
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isPending}
              aria-label="Enable the prepayment discount"
            />
            {enabled ? "On" : "Off"}
          </label>

          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              disabled={isPending || !enabled}
              aria-label="Annual discount percentage"
              className="h-9 w-[86px] text-right"
            />
            <span className="font-mono text-[12px] text-muted-foreground">
              % / yr
            </span>
          </div>

          <Button size="sm" onClick={save} disabled={isPending || invalid || !dirty}>
            {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      {invalid && (
        <p className="mt-2 text-[11.5px] text-neg">
          Enter a percentage between 0 and 100.
        </p>
      )}
    </div>
  );
}
