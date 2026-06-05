"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { UUID } from "node:crypto";
import {
  Ban,
  CalendarDays,
  Loader2,
  Wallet,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/auth/permission-guard";
import CustomerPrepaymentTopUpDialog from "./customer-prepayment-topup-dialog";

import {
  getCustomerPrepaymentOverview,
  voidCustomerPrepayment,
} from "@/lib/actions/customer-prepayments-actions";
import type {
  CustomerPrepaymentOverview,
  PrepaymentInstrument,
  PrepaymentStatus,
  PrepaymentTransaction,
} from "@/types/customer-prepayments/type";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString() : "—";

const STATUS_VARIANT: Record<
  PrepaymentStatus,
  "pos" | "soft" | "outline"
> = {
  ACTIVE: "pos",
  PENDING_PAYMENT: "soft",
  FULLY_CONSUMED: "soft",
  EXPIRED: "outline",
  VOIDED: "outline",
};

const STATUS_LABEL: Record<PrepaymentStatus, string> = {
  ACTIVE: "Active",
  PENDING_PAYMENT: "Pending payment",
  FULLY_CONSUMED: "Fully used",
  EXPIRED: "Expired",
  VOIDED: "Voided",
};

export function CustomerPrepaidAccountTab({
  customerId,
  locationId,
}: {
  customerId: UUID;
  locationId: UUID;
}) {
  const [overview, setOverview] = useState<CustomerPrepaymentOverview | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getCustomerPrepaymentOverview(customerId, locationId);
    setOverview(data);
    setLoading(false);
  }, [customerId, locationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading prepaid account…
        </CardContent>
      </Card>
    );
  }

  const currency = overview?.currency ?? "TZS";
  const balance = overview?.availableBalance ?? 0;
  const instruments = overview?.instruments ?? [];
  const transactions = overview?.transactions ?? [];

  return (
    <div className="space-y-4">
      {/* ── Available credit ─────────────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-4 pt-6">
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Available credit
            </h3>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-nums">
                {fmt(balance)}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {currency}
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground">
              Prepaid funds the customer can spend on future orders. The
              business owes this back as credit.
            </p>
          </div>
          <PermissionGuard permission="customer_prepayments:create">
            <CustomerPrepaymentTopUpDialog
              customerId={customerId}
              locationId={locationId}
              currency={currency}
              onSuccess={refresh}
            />
          </PermissionGuard>
        </CardContent>
      </Card>

      {/* ── Active top-ups ───────────────────────────────────────── */}
      {instruments.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="text-sm font-semibold">Top-ups</h3>
            <div className="overflow-hidden rounded-lg border border-line bg-line">
              <div className="grid grid-cols-1 gap-px bg-line">
                {instruments.map((inst) => (
                  <InstrumentRow
                    key={inst.id as string}
                    instrument={inst}
                    customerId={customerId}
                    onChanged={refresh}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Transaction history ──────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <h3 className="text-sm font-semibold">Transactions</h3>
          {transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No prepaid activity yet. Record a top-up to get started.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-line">
              <div className="grid grid-cols-1 gap-px bg-line">
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id as string} tx={tx} currency={currency} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InstrumentRow({
  instrument,
  customerId,
  onChanged,
}: {
  instrument: PrepaymentInstrument;
  customerId: UUID;
  onChanged: () => void;
}) {
  const voidable =
    instrument.status === "ACTIVE" ||
    instrument.status === "PENDING_PAYMENT";
  return (
    <div className="flex items-center justify-between gap-3 bg-card px-4 py-3">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink tabular-nums">
            {fmt(instrument.currentBalance)} / {fmt(instrument.initialBalance)}{" "}
            <span className="font-mono text-[11px] text-muted-foreground">
              {instrument.currency}
            </span>
          </span>
          <Badge
            variant={STATUS_VARIANT[instrument.status]}
            className="text-[10.5px]"
          >
            {STATUS_LABEL[instrument.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>Topped up {fmtDate(instrument.issuedAt)}</span>
          {instrument.expiresAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Expires {fmtDate(instrument.expiresAt)}
            </span>
          )}
          {instrument.sourceType !== "TOPUP" && (
            <span className="uppercase tracking-wide">
              {instrument.sourceType.replace(/_/g, " ").toLowerCase()}
            </span>
          )}
        </div>
      </div>
      {voidable && (
        <PermissionGuard permission="customer_prepayments:manage">
          <VoidInstrumentButton
            instrumentId={instrument.id}
            customerId={customerId}
            onDone={onChanged}
          />
        </PermissionGuard>
      )}
    </div>
  );
}

function TransactionRow({
  tx,
  currency,
}: {
  tx: PrepaymentTransaction;
  currency: string;
}) {
  const credit = tx.amount >= 0;
  const label =
    tx.type === "ISSUED"
      ? "Top-up"
      : tx.type === "REDEEMED"
        ? tx.orderId
          ? `Spent on order ${String(tx.orderId).slice(0, 8)}`
          : "Spent"
        : tx.type === "REFUNDED"
          ? "Refund"
          : tx.type === "EXPIRED"
            ? "Expired"
            : "Voided";
  return (
    <div className="flex items-center justify-between gap-3 bg-card px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ink">{label}</p>
        <p className="text-[11px] text-muted-foreground">
          {new Date(tx.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="text-right">
        <span
          className={`text-[13px] font-semibold tabular-nums ${
            credit ? "text-pos" : "text-neg"
          }`}
        >
          {credit ? "+" : "−"}
          {fmt(Math.abs(tx.amount))}
        </span>
        <p className="font-mono text-[10.5px] text-muted-foreground">
          bal {fmt(tx.balanceAfter)} {currency}
        </p>
      </div>
    </div>
  );
}

function VoidInstrumentButton({
  instrumentId,
  customerId,
  onDone,
}: {
  instrumentId: UUID;
  customerId: UUID;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const submit = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await voidCustomerPrepayment(
        instrumentId,
        trimmed,
        customerId,
      );
      if (result.responseType === "success") {
        toast({ title: "Prepaid balance voided" });
        setOpen(false);
        setReason("");
        onDone();
      } else {
        toast({
          title: "Could not void",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-neg hover:text-neg">
          <Ban className="mr-1.5 h-3.5 w-3.5" />
          Void
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Void prepaid balance</DialogTitle>
          <DialogDescription className="text-xs">
            This writes off the remaining balance on this top-up. The customer
            will no longer be able to spend it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="void-reason" className="text-xs text-muted-foreground">
            REASON
          </Label>
          <Input
            id="void-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Refunded to customer in cash"
            disabled={isPending}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={submit}
            disabled={isPending || !reason.trim()}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Voiding…
              </>
            ) : (
              "Void balance"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
