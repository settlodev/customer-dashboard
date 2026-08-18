"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Loader2, ShoppingBag, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { purchaseCreditPack } from "@/lib/actions/billing-actions";
import {
  formatBillingDateTime,
  getCreditTxnLabel,
} from "./shared";
import type {
  CreditBalance,
  CreditPack,
  CreditTransaction,
} from "@/types/billing/types";

interface CreditsTabProps {
  businessId: string;
  balances: CreditBalance[];
  packs: CreditPack[];
  recentTransactions: CreditTransaction[];
}

export function CreditsTab({ businessId, balances, packs, recentTransactions }: CreditsTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = useCallback(
    async (pack: CreditPack) => {
      setPurchasing(pack.id);
      try {
        const updated = await purchaseCreditPack(businessId, pack.id);
        toast({
          title: "Credits purchased",
          description: `${pack.creditAmount.toLocaleString()} ${pack.creditTypeName} credits added — new balance ${updated.balance.toLocaleString()}.`,
        });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Purchase failed",
          description: (error as Error)?.message ?? "Please try again.",
        });
      } finally {
        setPurchasing(null);
      }
    },
    [businessId, toast, router],
  );

  return (
    <div className="space-y-[30px]">
      <section>
        <SectionHeader
          icon={<Coins className="h-3.5 w-3.5" />}
          title="Credit balances"
          description="Available credit for SMS, email, and other usage-based features."
          tone="text-pos"
        />
        {balances.length === 0 ? (
          <EmptyState
            icon={<Coins className="h-5 w-5" />}
            message="No credit balances yet. Purchase a pack below to top up."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((bal) => (
              <div
                key={bal.creditTypeId}
                className="rounded-xl border border-line bg-card p-4 shadow-[0_1px_2px_rgba(20,17,12,0.03)]"
              >
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                  {bal.creditTypeCode}
                </p>
                <p className="mt-1 truncate text-sm font-medium text-ink">{bal.creditTypeName}</p>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-ink">
                  {bal.balance.toLocaleString()}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  Updated {formatBillingDateTime(bal.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          icon={<ShoppingBag className="h-3.5 w-3.5" />}
          title="Top up credits"
          description="Purchase a credit pack — credits arrive immediately on your balance."
          tone="text-[hsl(var(--primary-dark))]"
        />
        {packs.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            message="No credit packs are available right now."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => {
              const isBusy = purchasing === pack.id;
              return (
                <div
                  key={pack.id}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4 shadow-[0_1px_2px_rgba(20,17,12,0.03)]"
                >
                  <div>
                    <Badge variant="soft" className="mb-2">
                      {pack.creditTypeName}
                    </Badge>
                    <p className="text-sm font-medium text-ink">{pack.name}</p>
                    {pack.description && (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                        {pack.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-semibold tabular-nums text-ink">
                      {pack.creditAmount.toLocaleString()}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">credits</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                    <span className="font-medium tabular-nums text-ink">
                      {formatMoney(pack.price, "TZS")}
                    </span>
                    <Button size="sm" onClick={() => handlePurchase(pack)} disabled={isBusy}>
                      {isBusy ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Buying…
                        </>
                      ) : (
                        "Buy pack"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          icon={<History className="h-3.5 w-3.5" />}
          title="Recent activity"
          description="Latest credit movements — purchases, usage, and adjustments."
        />
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            message="No credit activity yet."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(20,17,12,0.03)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {formatBillingDateTime(txn.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="soft">{getCreditTxnLabel(txn.transactionType)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-ink">{txn.creditTypeCode}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {txn.description || "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        txn.amount > 0 ? "text-pos" : txn.amount < 0 ? "text-neg" : "text-ink",
                      )}
                    >
                      {txn.amount > 0 ? "+" : ""}
                      {txn.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-ink">
                      {txn.balanceAfter.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  tone = "text-ink-3",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Utility class colouring the mono section label + its icon. */
  tone?: string;
}) {
  return (
    <div className="mb-4">
      <h2
        className={cn(
          "flex items-center gap-2 font-mono text-[11.5px] font-semibold uppercase tracking-[0.1em]",
          tone,
        )}
      >
        {icon}
        {title}
      </h2>
      <p className="mt-1.5 text-[13px] text-muted-foreground">{description}</p>
    </div>
  );
}

function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-card px-6 py-13 text-center shadow-[0_1px_2px_rgba(20,17,12,0.03)]">
      <div className="mx-auto mb-3.5 grid h-11 w-11 place-items-center rounded-xl bg-canvas text-muted-2">
        {icon}
      </div>
      <p className="text-[15px] text-muted-foreground">{message}</p>
    </div>
  );
}
