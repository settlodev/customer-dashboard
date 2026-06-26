"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CreditCard, Eye, MoreHorizontal } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { voidInvoice } from "@/lib/actions/invoicing-invoice-actions";
import type { Invoice } from "@/types/invoicing/type";

interface Props {
  data: Invoice;
}

export function InvoiceCellAction({ data }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmVoid, setConfirmVoid] = useState(false);

  const canPay =
    data.status === "ISSUED" && data.paymentStatus !== "PAID";
  // Void is only allowed before any payment has landed.
  const canVoid = data.status === "ISSUED" && data.paymentStatus === "UNPAID";

  const doVoid = () =>
    startTransition(async () => {
      const result = await voidInvoice(data.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Success" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") router.refresh();
    });

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
          <DropdownMenuItem onClick={() => router.push(`/invoices/${data.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View detail
          </DropdownMenuItem>
          {canPay && (
            <DropdownMenuItem
              onClick={() => router.push(`/invoices/${data.id}?pay=1`)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Record payment
            </DropdownMenuItem>
          )}
          {canVoid && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => setConfirmVoid(true)}
                className="text-red-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                Void
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmVoid} onOpenChange={setConfirmVoid}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              {data.invoiceNumber} will be marked VOIDED and the receivable
              reversed in the journal. Only unpaid invoices can be voided — for
              one with payments, issue a credit note instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={doVoid}>
              Void
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
