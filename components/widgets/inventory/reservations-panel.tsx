"use client";

import { useMemo } from "react";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockReservation } from "@/types/stock-reservation/type";
import {
  RESERVATION_REFERENCE_LABELS,
  RESERVATION_STATUS_CONFIG,
} from "@/types/stock-reservation/type";

interface Props {
  reservations: StockReservation[];
}

/**
 * Read-only view of active/expired/released stock reservations for a location.
 * Drives the "why can't I sell this item?" debugging flow.
 */
export function ReservationsPanel({ reservations }: Props) {
  const active = useMemo(
    () => reservations.filter((r) => r.status === "ACTIVE"),
    [reservations],
  );
  const expired = useMemo(
    () => reservations.filter((r) => r.status === "EXPIRED"),
    [reservations],
  );

  const reservedQty = active.reduce((s, r) => s + Number(r.quantity ?? 0), 0);
  const expiredQty = expired.reduce((s, r) => s + Number(r.quantity ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Active reservations"
          value={active.length.toLocaleString()}
          sub={`${reservedQty.toLocaleString()} units held`}
          tone="green"
        />
        <StatCard
          label="Expired"
          value={expired.length.toLocaleString()}
          sub={`${expiredQty.toLocaleString()} units — cleanup pending`}
          tone={expired.length > 0 ? "amber" : "slate"}
        />
        <StatCard
          label="Total tracked"
          value={reservations.length.toLocaleString()}
          sub="Includes released rows in lookback window"
          tone="slate"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Reservations
            </h3>
          </div>

          {reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No reservations — nothing is currently holding stock.
            </p>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((r) => {
                    const cfg = RESERVATION_STATUS_CONFIG[r.status];
                    const refLabel = r.referenceType
                      ? (RESERVATION_REFERENCE_LABELS[r.referenceType] ?? r.referenceType)
                      : "\u2014";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm font-medium">
                          {r.stockVariantName ?? r.stockVariantId.slice(0, 8)}
                          {r.stockVariantSku && (
                            <span className="block text-[10px] text-muted-foreground">
                              SKU: {r.stockVariantSku}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {Number(r.quantity).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {refLabel}
                          {r.referenceId && (
                            <span className="block text-[10px] font-mono text-muted-foreground">
                              {r.referenceId.slice(0, 8)}…
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.reservedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {r.reservationExpiresAt
                            ? new Date(r.reservationExpiresAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "\u2014"}
                        </TableCell>
                        <TableCell>
                          <ToneBadge tone={cfg.tone}>{cfg.label}</ToneBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "green" | "amber" | "slate";
}) {
  const valueClass =
    tone === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-gray-900 dark:text-gray-100";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-2xl font-bold mt-0.5 ${valueClass}`}>{value}</p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ToneBadge({
  tone,
  children,
}: {
  tone: "green" | "amber" | "slate";
  children: React.ReactNode;
}) {
  const cls =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}
