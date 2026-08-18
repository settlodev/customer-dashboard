"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RotateCcw } from "lucide-react";
import { z } from "zod";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { createRefund } from "@/lib/actions/admin/billing";
import { CreateRefundSchema } from "@/types/admin/schemas";
import { InvoiceResponse } from "@/types/admin/billing";

interface IssueRefundDialogProps {
  businessId: string;
  invoice: InvoiceResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function IssueRefundDialog({
  businessId,
  invoice,
  open,
  onOpenChange,
  onCreated,
}: IssueRefundDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof CreateRefundSchema>>({
    resolver: zodResolver(CreateRefundSchema),
    defaultValues: {
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      reason: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        reason: "",
      });
      setError("");
    }
  }, [open, invoice.id, invoice.totalAmount, form]);

  const onSubmit = (values: z.infer<typeof CreateRefundSchema>) => {
    setError("");
    startTransition(async () => {
      const result = await createRefund(businessId, values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({
        title: "Refund requested",
        description: `Pending approval for ${invoice.invoiceNumber}.`,
      });
      onCreated();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-violet-500" />
            Issue refund
          </DialogTitle>
          <DialogDescription>
            Files a refund request against {invoice.invoiceNumber}. The refund
            stays PENDING until approved (the queue lives in the invoice
            actions menu).
          </DialogDescription>
        </DialogHeader>

        {error && <FormError message={error} />}

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            noValidate
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0.01}
                      step="0.01"
                      max={invoice.totalAmount}
                      disabled={isPending}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="font-mono text-[10.5px] text-muted-foreground">
              Invoice total: {invoice.totalAmount.toLocaleString()}
            </p>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Why is this customer being refunded?"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  "Request refund"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
