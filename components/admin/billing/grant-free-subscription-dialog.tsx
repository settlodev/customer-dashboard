"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, Loader2 } from "lucide-react";
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

import { grantFreeSubscription } from "@/lib/actions/admin/billing";
import { GrantFreeSubscriptionSchema } from "@/types/admin/schemas";

interface GrantFreeSubscriptionDialogProps {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGranted: () => void;
}

export function GrantFreeSubscriptionDialog({
  businessId,
  open,
  onOpenChange,
  onGranted,
}: GrantFreeSubscriptionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof GrantFreeSubscriptionSchema>>({
    resolver: zodResolver(GrantFreeSubscriptionSchema),
    defaultValues: { durationMonths: undefined, reason: "" },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ durationMonths: undefined, reason: "" });
      setError("");
    }
  }, [open, form]);

  const onSubmit = (values: z.infer<typeof GrantFreeSubscriptionSchema>) => {
    setError("");
    startTransition(async () => {
      const result = await grantFreeSubscription(businessId, values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({
        title: "Free subscription granted",
        description: result.message,
      });
      onGranted();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-violet-500" />
            Grant free subscription
          </DialogTitle>
          <DialogDescription>
            Applies a 100% discount for the chosen duration. Leave blank for
            unlimited. This action is logged with the reason you provide.
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
              name="durationMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration in months (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      placeholder="Unlimited"
                      disabled={isPending}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        field.onChange(raw === "" ? undefined : Number(raw));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Why is this customer getting a free subscription?"
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
              <Button
                type="submit"
                disabled={isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Granting…
                  </span>
                ) : (
                  "Grant free subscription"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
