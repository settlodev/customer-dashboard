"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  CircleSlash,
  CreditCard,
  Loader2,
  MoreHorizontal,
  Pencil,
  Table2,
  Trash,
  UserCheck,
  UserX,
} from "lucide-react";
import { UUID } from "node:crypto";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";
import {
  deleteReservation,
  payReservationDeposit,
  updateReservation,
  updateReservationStatus,
} from "@/lib/actions/reservation-actions";
import { fetchLocationPaymentMethods } from "@/lib/actions/payment-method-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";

import { Reservation } from "@/types/reservation/type";
import {
  DepositPaymentStatus,
  ReservationStatus,
} from "@/types/enums";
import { Space } from "@/types/space/type";
import { PaymentMethod } from "@/types/payments/type";

const TERMINAL_STATUSES = new Set<ReservationStatus>([
  ReservationStatus.COMPLETED,
  ReservationStatus.CANCELLED,
  ReservationStatus.NO_SHOW,
]);

type DialogKey =
  | "confirm"
  | "seat"
  | "complete"
  | "cancel"
  | "noShow"
  | "assignTable"
  | "recordDeposit"
  | "delete"
  | null;

export function ReservationActions({
  reservation,
}: {
  reservation: Reservation;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeDialog, setActiveDialog] = useState<DialogKey>(null);
  const [isPending, startTransition] = useTransition();

  const status = reservation.reservationStatus;
  const isTerminal = TERMINAL_STATUSES.has(status);
  const hasTable = Boolean(reservation.tableAndSpace);
  const depositPending =
    reservation.depositPaymentStatus === DepositPaymentStatus.PENDING;
  const depositRequired =
    reservation.depositAmount != null && reservation.depositAmount > 0;
  const canRecordDeposit = depositRequired && depositPending;

  const close = () => setActiveDialog(null);

  const runStatus = (next: ReservationStatus, successCopy: string) => {
    startTransition(async () => {
      try {
        const res = await updateReservationStatus(reservation.id, next);
        if (res && res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't update reservation",
            description: SettloErrorHandler.safeMessage(res.message),
          });
          return;
        }
        toast({ variant: "success", title: successCopy });
        close();
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description:
            (error as Error)?.message ?? "Please try again later.",
        });
      }
    });
  };

  const runDelete = () => {
    startTransition(async () => {
      try {
        await deleteReservation(reservation.id);
        toast({ variant: "success", title: "Reservation deleted" });
        router.push("/reservations");
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Couldn't delete reservation",
          description:
            (error as Error)?.message ?? "Please try again later.",
        });
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PrimaryStatusButtons
        status={status}
        isPending={isPending}
        onConfirm={() => setActiveDialog("confirm")}
        onSeat={() => setActiveDialog("seat")}
        onComplete={() => setActiveDialog("complete")}
        onNoShow={() => setActiveDialog("noShow")}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
            More
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Manage reservation</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/reservations/${reservation.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit details
            </Link>
          </DropdownMenuItem>

          {!isTerminal && (
            <DropdownMenuItem onClick={() => setActiveDialog("assignTable")}>
              <Table2 className="mr-2 h-4 w-4" />
              {hasTable ? "Change table" : "Assign table"}
            </DropdownMenuItem>
          )}

          {canRecordDeposit && (
            <DropdownMenuItem onClick={() => setActiveDialog("recordDeposit")}>
              <CreditCard className="mr-2 h-4 w-4" />
              Record deposit
            </DropdownMenuItem>
          )}

          {!isTerminal && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActiveDialog("cancel")}
                className="text-red-600 focus:text-red-600"
              >
                <CircleSlash className="mr-2 h-4 w-4" />
                Cancel reservation
              </DropdownMenuItem>
            </>
          )}

          {reservation.canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActiveDialog("delete")}
                className="text-red-600 focus:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete reservation
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={activeDialog === "confirm"}
        onOpenChange={(o) => !o && close()}
        icon={<CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        iconBg="bg-blue-50 dark:bg-blue-950/30"
        title="Confirm this reservation?"
        description="The booking will move from pending to confirmed and the customer slot will be locked in."
        confirmLabel="Confirm reservation"
        confirmVariant="default"
        isPending={isPending}
        onConfirm={() =>
          runStatus(ReservationStatus.CONFIRMED, "Reservation confirmed")
        }
      />

      <ConfirmDialog
        open={activeDialog === "seat"}
        onOpenChange={(o) => !o && close()}
        icon={<UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-50 dark:bg-emerald-950/30"
        title="Mark guest as arrived?"
        description={
          hasTable
            ? `Seats the party at ${reservation.tableAndSpaceName}. The table status will switch to occupied.`
            : "Marks the guest as arrived. They have no table yet — assign one first if you can."
        }
        confirmLabel="Mark arrived"
        confirmVariant="success"
        isPending={isPending}
        onConfirm={() =>
          runStatus(ReservationStatus.SEATED, "Guest seated")
        }
      />

      <ConfirmDialog
        open={activeDialog === "complete"}
        onOpenChange={(o) => !o && close()}
        icon={<CalendarCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-50 dark:bg-emerald-950/30"
        title="Complete this reservation?"
        description="Use this when the party has finished and left. The reservation will be closed and the table freed."
        confirmLabel="Complete reservation"
        confirmVariant="success"
        isPending={isPending}
        onConfirm={() =>
          runStatus(ReservationStatus.COMPLETED, "Reservation completed")
        }
      />

      <ConfirmDialog
        open={activeDialog === "cancel"}
        onOpenChange={(o) => !o && close()}
        icon={<CircleSlash className="h-6 w-6 text-red-600 dark:text-red-400" />}
        iconBg="bg-red-50 dark:bg-red-950/30"
        title="Cancel this reservation?"
        description={
          reservation.depositPaymentStatus === DepositPaymentStatus.PAID
            ? "This will cancel the booking and trigger a deposit refund. The customer's slot is freed up."
            : "This will cancel the booking. The customer's slot is freed up."
        }
        confirmLabel="Cancel reservation"
        confirmVariant="destructive"
        isPending={isPending}
        onConfirm={() =>
          runStatus(ReservationStatus.CANCELLED, "Reservation cancelled")
        }
      />

      <ConfirmDialog
        open={activeDialog === "noShow"}
        onOpenChange={(o) => !o && close()}
        icon={<UserX className="h-6 w-6 text-orange-600 dark:text-orange-400" />}
        iconBg="bg-orange-50 dark:bg-orange-950/30"
        title="Mark as no-show?"
        description="Use this when the booking time has passed and the guest didn't arrive. A no-show fee may apply if your settings allow it."
        confirmLabel="Mark no-show"
        confirmVariant="destructive"
        isPending={isPending}
        onConfirm={() =>
          runStatus(ReservationStatus.NO_SHOW, "Marked as no-show")
        }
      />

      <ConfirmDialog
        open={activeDialog === "delete"}
        onOpenChange={(o) => !o && close()}
        icon={<Trash className="h-6 w-6 text-red-600 dark:text-red-400" />}
        iconBg="bg-red-50 dark:bg-red-950/30"
        title="Delete this reservation?"
        description="This permanently archives the reservation. Past records and event timeline are preserved."
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={isPending}
        onConfirm={runDelete}
      />

      <AssignTableDialog
        open={activeDialog === "assignTable"}
        onOpenChange={(o) => !o && close()}
        reservation={reservation}
        onDone={() => {
          close();
          router.refresh();
        }}
      />

      <RecordDepositDialog
        open={activeDialog === "recordDeposit"}
        onOpenChange={(o) => !o && close()}
        reservation={reservation}
        onDone={() => {
          close();
          router.refresh();
        }}
      />
    </div>
  );
}

// ─── Primary status buttons ─────────────────────────────────────────

function PrimaryStatusButtons({
  status,
  isPending,
  onConfirm,
  onSeat,
  onComplete,
  onNoShow,
}: {
  status: ReservationStatus;
  isPending: boolean;
  onConfirm: () => void;
  onSeat: () => void;
  onComplete: () => void;
  onNoShow: () => void;
}) {
  switch (status) {
    case ReservationStatus.PENDING:
      return (
        <Button size="sm" onClick={onConfirm} disabled={isPending}>
          <CheckCircle2 className="h-4 w-4" />
          Confirm
        </Button>
      );
    case ReservationStatus.CONFIRMED:
      return (
        <>
          <Button
            size="sm"
            variant="success"
            onClick={onSeat}
            disabled={isPending}
          >
            <UserCheck className="h-4 w-4" />
            Mark arrived
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onNoShow}
            disabled={isPending}
            className="text-orange-700 hover:text-orange-800 dark:text-orange-400"
          >
            <UserX className="h-4 w-4" />
            No-show
          </Button>
        </>
      );
    case ReservationStatus.SEATED:
      return (
        <Button
          size="sm"
          variant="success"
          onClick={onComplete}
          disabled={isPending}
        >
          <CalendarCheck className="h-4 w-4" />
          Complete
        </Button>
      );
    default:
      return null;
  }
}

// ─── Generic confirm dialog ─────────────────────────────────────────

function ConfirmDialog({
  open,
  onOpenChange,
  icon,
  iconBg,
  title,
  description,
  confirmLabel,
  confirmVariant,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: "default" | "success" | "destructive";
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}
          >
            {icon}
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Back
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign / change table dialog ───────────────────────────────────

function AssignTableDialog({
  open,
  onOpenChange,
  reservation,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [tables, setTables] = useState<Space[]>([]);
  const [tableId, setTableId] = useState<string>(
    (reservation.tableAndSpace as string | null) ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchAllTables()
      .then((data) => {
        if (cancelled) return;
        setTables(
          data.filter((t) => t.reservable && t.active),
        );
      })
      .catch(() => {
        if (cancelled) return;
        toast({
          variant: "destructive",
          title: "Couldn't load tables",
          description: "Please try again in a moment.",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, toast]);

  useEffect(() => {
    if (open) {
      setTableId((reservation.tableAndSpace as string | null) ?? "");
    }
  }, [open, reservation.tableAndSpace]);

  const partySize = reservation.peopleCount ?? 0;
  const sortedTables = useMemo(() => {
    return [...tables].sort((a, b) => {
      const aFits = a.capacity >= partySize ? 0 : 1;
      const bFits = b.capacity >= partySize ? 0 : 1;
      if (aFits !== bFits) return aFits - bFits;
      return a.capacity - b.capacity;
    });
  }, [tables, partySize]);

  const submit = () => {
    if (!tableId) {
      toast({
        variant: "destructive",
        title: "Pick a table",
        description: "Choose a table from the list before saving.",
      });
      return;
    }
    startTransition(async () => {
      const res = await updateReservation(reservation.id, {
        tableSpaceId: tableId as UUID,
      });
      if (res && res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't assign table",
          description: SettloErrorHandler.safeMessage(res.message),
        });
        return;
      }
      toast({ variant: "success", title: "Table assigned" });
      onDone();
    });
  };

  const isChange = Boolean(reservation.tableAndSpace);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isChange ? "Change table" : "Assign table"}</DialogTitle>
          <DialogDescription>
            {isChange
              ? `Currently seated at ${reservation.tableAndSpaceName ?? "—"}. Pick a different table below.`
              : `Pick a table for the party of ${partySize || "—"}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="reservation-table">Table</Label>
            <Select
              value={tableId}
              onValueChange={setTableId}
              disabled={loading || isPending}
            >
              <SelectTrigger id="reservation-table">
                <SelectValue
                  placeholder={loading ? "Loading tables…" : "Select a table"}
                />
              </SelectTrigger>
              <SelectContent>
                {sortedTables.map((t) => {
                  const fits = t.capacity >= partySize;
                  return (
                    <SelectItem key={t.id as string} value={t.id as string}>
                      <span className="flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-xs text-muted-foreground">
                          · {t.capacity} seats
                        </span>
                        {!fits && partySize > 0 && (
                          <span className="text-[10px] font-medium uppercase tracking-wide text-orange-600">
                            small
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
                {!loading && sortedTables.length === 0 && (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    No reservable tables available.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {partySize > 0 &&
            tableId &&
            tables.find((t) => t.id === tableId) &&
            (tables.find((t) => t.id === tableId)!.capacity < partySize) && (
              <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-2.5 text-[12px] text-orange-800 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  This table seats fewer than {partySize}. The party may need to
                  split.
                </span>
              </div>
            )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || !tableId}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isChange ? "Change table" : "Assign table"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Record deposit dialog ──────────────────────────────────────────

function flattenPaymentMethods(methods: PaymentMethod[]): PaymentMethod[] {
  const flat: PaymentMethod[] = [];
  for (const m of methods) {
    if (m.enabled) flat.push(m);
    if (m.children?.length) {
      for (const c of m.children) {
        if (c.enabled) {
          flat.push({ ...c, providerId: null, providerName: null, children: null } as PaymentMethod);
        }
      }
    }
  }
  return flat;
}

function RecordDepositDialog({
  open,
  onOpenChange,
  reservation,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodId, setMethodId] = useState<string>("");
  const [phone, setPhone] = useState<string>(reservation.customerPhone ?? "");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchLocationPaymentMethods()
      .then((data) => {
        if (cancelled) return;
        setMethods(flattenPaymentMethods(data));
      })
      .catch(() => {
        if (cancelled) return;
        toast({
          variant: "destructive",
          title: "Couldn't load payment methods",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, toast]);

  useEffect(() => {
    if (open) {
      setPhone(reservation.customerPhone ?? "");
      setNote("");
      setMethodId("");
    }
  }, [open, reservation.customerPhone]);

  const submit = () => {
    if (!methodId) {
      toast({
        variant: "destructive",
        title: "Pick a payment method",
      });
      return;
    }
    startTransition(async () => {
      const res = await payReservationDeposit(reservation.id, {
        paymentMethodId: methodId,
        customerPhone: phone || undefined,
        confirmationNote: note || undefined,
      });
      if ("responseType" in res && res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't record deposit",
          description: SettloErrorHandler.safeMessage(res.message),
        });
        return;
      }
      toast({
        variant: "success",
        title: "Deposit recorded",
        description:
          "responseType" in res
            ? undefined
            : res.message ?? `Status: ${res.paymentStatus}`,
      });
      onDone();
    });
  };

  const amount = reservation.depositAmount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record deposit</DialogTitle>
          <DialogDescription>
            Confirm how the customer paid the booking deposit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-md border border-line bg-canvas px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Deposit amount
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-[22px] font-semibold tabular-nums text-ink">
                {amount.toLocaleString()}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                TZS
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-method">Payment method</Label>
            <Select
              value={methodId}
              onValueChange={setMethodId}
              disabled={loading || isPending}
            >
              <SelectTrigger id="deposit-method">
                <SelectValue
                  placeholder={loading ? "Loading…" : "Select payment method"}
                />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.id as string} value={m.id as string}>
                    {m.displayName}
                  </SelectItem>
                ))}
                {!loading && methods.length === 0 && (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    No enabled payment methods at this location.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-phone">
              Customer phone{" "}
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                optional
              </span>
            </Label>
            <Input
              id="deposit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +255 7XX XXX XXX"
              disabled={isPending}
            />
            <p className="text-[11px] text-muted-foreground">
              Used for mobile-money push notifications.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-note">
              Confirmation note{" "}
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                optional
              </span>
            </Label>
            <Textarea
              id="deposit-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reference number, receipt info, or any context for the audit log."
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || !methodId}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Record deposit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
