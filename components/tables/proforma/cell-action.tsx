"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Edit,
  Eye,
  FileCheck2,
  MoreHorizontal,
  Send,
} from "lucide-react";

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
import {
  cancelProforma,
  convertProforma,
  shareProforma,
} from "@/lib/actions/invoicing-proforma-actions";
import {
  isProformaCancellable,
  isProformaConvertible,
  isProformaEditable,
  isProformaShareable,
  type Proforma,
} from "@/types/invoicing/type";

interface Props {
  data: Proforma;
}

export function ProformaCellAction({ data }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);

  const run = (fn: () => Promise<{ responseType: string; message: string }>) =>
    startTransition(async () => {
      const result = await fn();
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Success" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") router.refresh();
    });

  const convert = () =>
    startTransition(async () => {
      const result = await convertProforma(data.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Converted" : "Error",
        description: result.message,
      });
      if (result.responseType === "success" && result.data?.id) {
        router.push(`/invoices/${result.data.id}`);
      }
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
          <DropdownMenuItem
            onClick={() => router.push(`/proforma-invoices/${data.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View detail
          </DropdownMenuItem>
          {isProformaEditable(data.status) && (
            <DropdownMenuItem
              onClick={() => router.push(`/proforma-invoices/${data.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {isProformaShareable(data.status) && (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => run(() => shareProforma(data.id))}
            >
              <Send className="mr-2 h-4 w-4" />
              {data.shareToken ? "Mark as sent" : "Share"}
            </DropdownMenuItem>
          )}
          {isProformaConvertible(data.status) && (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => setConfirmConvert(true)}
            >
              <FileCheck2 className="mr-2 h-4 w-4" />
              Convert to invoice
            </DropdownMenuItem>
          )}
          {isProformaCancellable(data.status) && (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => setConfirmCancel(true)}
              className="text-red-600"
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmConvert} onOpenChange={setConfirmConvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to an invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              {data.proformaNumber} will be issued as an invoice and the
              receivable posted to the ledger. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={convert}>
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this proforma?</AlertDialogTitle>
            <AlertDialogDescription>
              {data.proformaNumber} will be marked CANCELLED. Any stock
              reservation it held is released.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Keep proforma
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => run(() => cancelProforma(data.id))}
            >
              Cancel proforma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
