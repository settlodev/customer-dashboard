"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { attachProspectInvoice } from "@/lib/actions/admin/billing";
import { AttachInvoiceSchema } from "@/types/admin/schemas";

interface AttachInvoiceDialogProps {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttached: () => void;
}

type FormValues = z.infer<typeof AttachInvoiceSchema>;

export function AttachInvoiceDialog({
  businessId,
  open,
  onOpenChange,
  onAttached,
}: AttachInvoiceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(AttachInvoiceSchema),
    defaultValues: {
      invoiceId: "",
      businessId,
      locationId: "",
      subscriptionId: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        invoiceId: "",
        businessId,
        locationId: "",
        subscriptionId: "",
      });
      setError("");
    }
  }, [open, businessId, form]);

  const onSubmit = (values: FormValues) => {
    setError("");
    startTransition(async () => {
      const result = await attachProspectInvoice({
        invoiceId: values.invoiceId,
        businessId: values.businessId,
        locationId: values.locationId || undefined,
        subscriptionId: values.subscriptionId || undefined,
      });
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      onAttached();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Attach prospect invoice</DialogTitle>
          <DialogDescription>
            Links a paid prospect invoice to this business. If you pass a
            subscription ID and the invoice has a PLAN line, the
            subscription activates automatically.
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
              name="invoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00000000-0000-0000-0000-000000000000"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location ID (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Leave blank to attach at the business level"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Required only when the invoice should be tied to a
                    specific location.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subscriptionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription ID (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Activate this subscription if the invoice has a PLAN line"
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
                    Attaching…
                  </span>
                ) : (
                  "Attach invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
