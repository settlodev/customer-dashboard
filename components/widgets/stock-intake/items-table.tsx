"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Money } from "@/components/widgets/money";
import { CorrectValueModal } from "@/components/widgets/inventory/correct-value-modal";
import SerialNumbersViewer from "@/components/stock-intakes/serial-numbers-viewer";
import type { StockIntakeRecordItem } from "@/types/stock-intake-record/type";
import type { StockBatch } from "@/types/stock-batch/type";

interface Props {
  intakeId: string;
  items: StockIntakeRecordItem[];
  currency: string;
  hasForeignLine: boolean;
  hasSerialLine: boolean;
  /** Only CONFIRMED intakes have minted batches worth correcting. */
  showCorrectAction: boolean;
  /** Live batch snapshot (qty on hand, initial qty, current cost) keyed by batchId. */
  batchDataByBatchId: Record<string, StockBatch>;
  /** Most recent corrected cost per batchId, from the corrections history. */
  effectiveCostByBatch: Record<string, number>;
  creditSideHint: "CREDIT" | "CASH" | "BANK";
}

/**
 * Client-side rendering of the intake's item table. Split out from the
 * (Server Component) detail page because CorrectValueModal holds open/close
 * state via useState — a "use client" factory can't be invoked from a Server
 * Component, it only fails at runtime, so the modal and the state that
 * drives it have to live in a client boundary like this one.
 */
export default function StockIntakeItemsTable({
  intakeId,
  items,
  currency,
  hasForeignLine,
  hasSerialLine,
  showCorrectAction,
  batchDataByBatchId,
  effectiveCostByBatch,
  creditSideHint,
}: Props) {
  const [selected, setSelected] = useState<{
    line: StockIntakeRecordItem;
    batch: StockBatch;
  } | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/60">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                SKU
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                Unit cost
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                Total
              </th>
              {hasForeignLine && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                  Originally
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                Batch
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                Expiry
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                Supplier ref
              </th>
              {hasSerialLine && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                  Serial numbers
                </th>
              )}
              {showCorrectAction && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((line) => {
              const lineCurrency = line.currency || currency;
              const isForeign =
                line.originalCurrency && line.originalCurrency !== lineCurrency;
              const batch = line.batchId ? batchDataByBatchId[line.batchId] : undefined;
              const effectiveCost = line.batchId
                ? effectiveCostByBatch[line.batchId]
                : undefined;
              return (
                <tr key={line.id} className="hover:bg-gray-50/50 align-top">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {line.stockVariantName}
                    {line.notes && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{line.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {line.stockVariantSku || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {Number(line.quantity).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {effectiveCost != null && effectiveCost !== line.unitCost ? (
                      <span className="flex flex-col items-end">
                        <span className="text-muted-foreground line-through text-xs">
                          <Money amount={line.unitCost} currency={lineCurrency} />
                        </span>
                        <span>
                          <Money amount={effectiveCost} currency={lineCurrency} />
                        </span>
                      </span>
                    ) : (
                      <Money amount={Number(line.unitCost)} currency={lineCurrency} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    <Money amount={Number(line.totalCost)} currency={lineCurrency} />
                  </td>
                  {hasForeignLine && (
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {isForeign ? (
                        <div className="flex flex-col">
                          <Money
                            amount={Number(line.originalUnitCost ?? 0)}
                            currency={line.originalCurrency}
                          />
                          {line.rateUsed != null && line.rateUsed !== 1 && (
                            <span className="text-[10px]">
                              @{" "}
                              {Number(line.rateUsed).toLocaleString(undefined, {
                                maximumFractionDigits: 6,
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-500">{line.batchNumber || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{line.expiryDate || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {line.supplierBatchReference || "—"}
                  </td>
                  {hasSerialLine && (
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      <SerialNumbersViewer
                        serialNumbers={line.serialNumbers ?? []}
                        itemName={line.stockVariantName}
                        sku={line.stockVariantSku}
                      />
                    </td>
                  )}
                  {showCorrectAction && (
                    <td className="px-4 py-3 text-right">
                      {batch ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected({ line, batch })}
                        >
                          Correct value
                        </Button>
                      ) : (
                        <TooltipProvider delayDuration={120}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0} className="inline-block">
                                <Button size="sm" variant="outline" disabled>
                                  Correct value
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[220px]">
                              {line.batchId
                                ? "Batch details are unavailable right now."
                                : "This receipt predates batch tracking. Correct this batch from the batch page instead."}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <CorrectValueModal
          variantId={selected.line.stockVariantId}
          variantName={selected.line.stockVariantName}
          batchId={selected.batch.id}
          batchNumber={selected.batch.batchNumber}
          currentUnitCost={selected.batch.unitCost ?? selected.line.unitCost}
          quantityOnHand={selected.batch.quantityOnHand}
          initialQuantity={selected.batch.initialQuantity}
          currency={selected.batch.currency ?? currency}
          creditSideHint={creditSideHint}
          sourceReferenceType="STOCK_INTAKE"
          sourceReferenceId={intakeId}
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </>
  );
}
