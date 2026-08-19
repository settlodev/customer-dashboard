"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileX2, HandCoins, MoreHorizontal } from "lucide-react";

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
import {
  recordArSettlement,
  recordArWriteOff,
} from "@/lib/actions/customer-ar-actions";
import { fetchLocationPaymentMethods } from "@/lib/actions/payment-method-actions";
import type { CustomerArBalance } from "@/types/customer-ar/type";
import type { PaymentMethod } from "@/types/payments/type";

interface Props {
  data: CustomerArBalance;
}

export function DebtorCellAction({ data }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [settleOpen, setSettleOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);

  const [amount, setAmount] = useState(String(data.outstandingBalance));
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  // Load the location's payment methods when the settle dialog first opens.
  // Signed-bill and complimentary methods can't collect a settlement, so
  // they never appear as options.
  useEffect(() => {
    if (!settleOpen || methods.length > 0) return;
    fetchLocationPaymentMethods()
      .then((all) =>
        setMethods(
          all.filter(
            (m) =>
              m.enabled && !m.signedBillEquivalent && !m.complimentaryEquivalent,
          ),
        ),
      )
      .catch(() => setMethods([]));
  }, [settleOpen, methods.length]);

  const finish = (result: { responseType: string; message: string }) => {
    toast({
      variant: result.responseType === "success" ? "success" : "destructive",
      title: result.responseType === "success" ? "Success" : "Error",
      description: result.message,
    });
    if (result.responseType === "success") {
      setSettleOpen(false);
      setWriteOffOpen(false);
      setNote("");
      setReason("");
      router.refresh();
    }
  };

  const submitSettlement = () =>
    startTransition(async () => {
      finish(
        await recordArSettlement({
          customerId: data.customerId,
          locationId: data.locationId,
          amount: Number(amount),
          paymentMethodId,
          note: note || undefined,
        }),
      );
    });

  const submitWriteOff = () =>
    startTransition(async () => {
      finish(
        await recordArWriteOff({
          customerId: data.customerId,
          locationId: data.locationId,
          reason: reason.trim(),
        }),
      );
    });

  const settleAmountValid =
    Number(amount) > 0 && Number(amount) <= data.outstandingBalance;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              setAmount(String(data.outstandingBalance));
              setSettleOpen(true);
            }}
          >
            <HandCoins className="mr-2 h-4 w-4" />
            Settle payment
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setWriteOffOpen(true)}
          >
            <FileX2 className="mr-2 h-4 w-4" />
            Write off debt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Settle ─────────────────────────────────────────────── */}
      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle payment</DialogTitle>
            <DialogDescription>
              Collect against this customer&apos;s outstanding balance of{" "}
              {data.outstandingBalance.toLocaleString()} {data.currency}.
              Signed bills settle oldest-first; any remainder settles the
              standalone balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settle-amount">Amount</Label>
              <Input
                id="settle-amount"
                type="number"
                min="0"
                max={data.outstandingBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select how the money was collected" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settle-note">Note (optional)</Label>
              <Input
                id="settle-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. paid at the office"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isPending || !settleAmountValid || !paymentMethodId}
              onClick={submitSettlement}
            >
              {isPending ? "Recording…" : "Record settlement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Write off ──────────────────────────────────────────── */}
      <Dialog open={writeOffOpen} onOpenChange={setWriteOffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write off debt</DialogTitle>
            <DialogDescription>
              Writes off the full outstanding{" "}
              {data.outstandingBalance.toLocaleString()} {data.currency} as bad
              debt. This can&apos;t be undone — the loss posts to the books.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="write-off-reason">Reason (required)</Label>
            <Textarea
              id="write-off-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this debt uncollectable?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWriteOffOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || reason.trim().length === 0}
              onClick={submitWriteOff}
            >
              {isPending ? "Writing off…" : "Write off"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
