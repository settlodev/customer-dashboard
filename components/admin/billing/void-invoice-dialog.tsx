"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { voidSubscriptionForInvoice } from "@/lib/actions/admin/billing";
import { VoidInvoiceSchema } from "@/types/admin/schemas";
import { InvoiceResponse } from "@/types/admin/billing";

interface VoidInvoiceDialogProps {
  businessId: string;
  invoice: InvoiceResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoided: () => void;
}

export function VoidInvoiceDialog({
  businessId,
  invoice,
  open,
  onOpenChange,
  onVoided,
}: VoidInvoiceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof VoidInvoiceSchema>>({
    resolver: zodResolver(VoidInvoiceSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: "" });
      setError("");
    }
  }, [open, form]);

  const onSubmit = (values: z.infer<typeof VoidInvoiceSchema>) => {
    setError("");
    startTransition(async () => {
      const result = await voidSubscriptionForInvoice(
        businessId,
        invoice.id,
        values.reason,
      );
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({
        title: "Subscription voided",
        description: `The subscription behind ${invoice.invoiceNumber} is gone — the business now looks unsubscribed.`,
      });
      onVoided();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Void subscription
          </DialogTitle>
          <DialogDescription>
            Voids the subscription behind {invoice.invoiceNumber} — for a
            subscription that should never have existed (an internal
            provisioning mistake), not a normal cancellation. The business
            will look unsubscribed and its next payment starts a brand-new
            subscription. No refund is issued and this cannot be undone.
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Why should this subscription never have existed?"
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
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Voiding…
                  </span>
                ) : (
                  "Void subscription"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
