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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { applyDiscount } from "@/lib/actions/admin/billing";
import { ApplyDiscountSchema } from "@/types/admin/schemas";
import { DiscountResponse } from "@/types/admin/billing";

interface ApplyDiscountDialogProps {
  businessId: string;
  discounts: DiscountResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}

export function ApplyDiscountDialog({
  businessId,
  discounts,
  open,
  onOpenChange,
  onApplied,
}: ApplyDiscountDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ApplyDiscountSchema>>({
    resolver: zodResolver(ApplyDiscountSchema),
    defaultValues: { discountId: "", reason: "" },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ discountId: "", reason: "" });
      setError("");
    }
  }, [open, form]);

  const onSubmit = (values: z.infer<typeof ApplyDiscountSchema>) => {
    setError("");
    startTransition(async () => {
      const result = await applyDiscount(businessId, values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: "Discount applied", description: result.message });
      onApplied();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Apply discount</DialogTitle>
          <DialogDescription>
            Choose a discount definition. It applies immediately to the active
            subscription on the next invoice cycle.
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
              name="discountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending || discounts.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            discounts.length === 0
                              ? "No active discounts available"
                              : "Choose a discount"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {discounts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{d.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {d.discountType === "PERCENTAGE"
                                ? `${d.discountValue}% off`
                                : `${d.discountValue} off`}
                              {d.durationMonths
                                ? ` · ${d.durationMonths} months`
                                : ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Note for the audit log…"
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
                    Applying…
                  </span>
                ) : (
                  "Apply discount"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
