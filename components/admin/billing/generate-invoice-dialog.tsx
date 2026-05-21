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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { generateInvoice } from "@/lib/actions/admin/billing";
import { GenerateInvoiceSchema } from "@/types/admin/schemas";

interface GenerateInvoiceDialogProps {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function GenerateInvoiceDialog({
  businessId,
  open,
  onOpenChange,
  onCreated,
}: GenerateInvoiceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof GenerateInvoiceSchema>>({
    resolver: zodResolver(GenerateInvoiceSchema),
    defaultValues: { months: 1 },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ months: 1 });
      setError("");
    }
  }, [open, form]);

  const onSubmit = (values: z.infer<typeof GenerateInvoiceSchema>) => {
    setError("");
    startTransition(async () => {
      const result = await generateInvoice(businessId, values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: "Invoice created", description: result.message });
      onCreated();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Generate invoice</DialogTitle>
          <DialogDescription>
            Creates a fresh invoice covering N months. Any existing PENDING
            invoice for this subscription is cancelled. 12+ months earns the
            annual discount.
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
              name="months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Months</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={36}
                      disabled={isPending}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                    Generating…
                  </span>
                ) : (
                  "Generate invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
