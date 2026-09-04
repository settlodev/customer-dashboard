"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Eye, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { cancelOrder } from "@/lib/actions/order-actions";
import { Order, OrderStatus } from "@/types/orders/type";

/**
 * Row actions for the Orders table. Cancel is the one an operator has no
 * other way to reach: an unpaid order left OPEN holds its table against every
 * new sale on the till (a live OPEN order is the server's authority on
 * occupancy), and until now clearing one meant a till with read-all or an
 * engineer. Gated on orders:cancel, the same key the till enforces.
 */
export function OrderCellAction({ data }: { data: Order }) {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [isPending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reason, setReason] = useState("");

  const canCancel =
    data.orderStatus === OrderStatus.OPEN && hasPermission("orders:cancel");

  const submitCancel = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await cancelOrder(data.id, trimmed, "OTHER");
      const ok = !result || result.responseType === "success";
      toast({
        variant: ok ? "success" : "destructive",
        title: ok ? "Order cancelled" : "Couldn't cancel order",
        description: ok
          ? `${data.orderName ?? data.orderNumber} was cancelled and its table released.`
          : result?.message,
      });
      if (ok) {
        setConfirmCancel(false);
        setReason("");
        router.refresh();
      }
    });
  };

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
          <DropdownMenuItem onClick={() => router.push(`/orders/${data.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View detail
          </DropdownMenuItem>
          {canCancel ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => setConfirmCancel(true)}
                className="text-red-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel order
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancel {data.orderName ?? data.orderNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The order is closed as cancelled, its table is released for new
              sales, and every till learns of it. Nothing was paid on it, so no
              money moves. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required) — e.g. left open by mistake, customer walked out"
            rows={3}
            disabled={isPending}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                submitCancel();
              }}
              disabled={isPending || !reason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Cancelling…" : "Cancel order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
