"use client";

import { useState } from "react";
import { ChevronDown, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CorrectValueModal } from "./correct-value-modal";

/**
 * One batch that can be re-costed from the current page. Mirrors the props
 * `CorrectValueModal` needs so a page can build targets straight from the
 * live batch snapshot it already fetched.
 */
export interface CorrectValueTarget {
  variantId: string;
  variantName: string;
  batchId: string;
  batchNumber: string;
  currentUnitCost: number;
  quantityOnHand: number;
  initialQuantity: number;
  currency?: string | null;
  creditSideHint?: string | null;
  sourceReferenceType?: "STOCK_INTAKE" | "OPENING_STOCK";
  sourceReferenceId?: string;
}

/**
 * The page-header "Correct value" action shared by the stock-batch and
 * stock-modification detail pages. A single target opens the modal directly;
 * several targets (a modification that touched more than one batch) open a
 * picker first so the operator chooses which batch to re-cost.
 *
 * Renders nothing when there is nothing to correct — a modification whose
 * lines predate batch tracking has no batch to re-cost.
 */
export function CorrectValueAction({ targets }: { targets: CorrectValueTarget[] }) {
  const [selected, setSelected] = useState<CorrectValueTarget | null>(null);

  if (targets.length === 0) return null;

  const trigger =
    targets.length === 1 ? (
      <Button size="sm" variant="outline" onClick={() => setSelected(targets[0])}>
        <PencilLine className="mr-1.5 h-4 w-4" />
        Correct value
      </Button>
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <PencilLine className="mr-1.5 h-4 w-4" />
            Correct value
            <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[240px]">
          <DropdownMenuLabel className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Which batch?
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {targets.map((t) => (
            <DropdownMenuItem
              key={t.batchId}
              onSelect={() => setSelected(t)}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="text-[13px] font-medium text-ink">{t.variantName}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {t.batchNumber} · {t.quantityOnHand.toLocaleString()} on hand
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );

  return (
    <>
      {trigger}
      {selected && (
        <CorrectValueModal
          key={selected.batchId}
          variantId={selected.variantId}
          variantName={selected.variantName}
          batchId={selected.batchId}
          batchNumber={selected.batchNumber}
          currentUnitCost={selected.currentUnitCost}
          quantityOnHand={selected.quantityOnHand}
          initialQuantity={selected.initialQuantity}
          currency={selected.currency}
          creditSideHint={selected.creditSideHint}
          sourceReferenceType={selected.sourceReferenceType}
          sourceReferenceId={selected.sourceReferenceId}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </>
  );
}

export default CorrectValueAction;
