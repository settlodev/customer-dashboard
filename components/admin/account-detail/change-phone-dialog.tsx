"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { changeAccountPhone } from "@/lib/actions/admin/accounts";
import { ChangePhoneSchema } from "@/types/admin/schemas";

type FormValues = z.infer<typeof ChangePhoneSchema>;

interface ChangePhoneDialogProps {
  accountId: string;
  currentPhone: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ChangePhoneDialog({
  accountId,
  currentPhone,
  open,
  onOpenChange,
}: ChangePhoneDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(ChangePhoneSchema),
    defaultValues: { phoneNumber: "" },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ phoneNumber: "" });
      setError("");
    }
  }, [open, form]);

  const onSubmit = (values: FormValues) => {
    setError("");
    startTransition(async () => {
      const res = await changeAccountPhone(accountId, values.phoneNumber.trim());
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      toast({ title: "Phone updated", description: res.message });
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Change phone</DialogTitle>
          <DialogDescription>
            Fix a wrong number while the phone is <strong>unverified</strong> and
            send a fresh verification code by SMS. A verified phone can only be
            changed by the owner from their own dashboard.
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
            <div className="space-y-1.5">
              <Label className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Current
              </Label>
              <p className="font-mono text-[13px] text-ink">
                {currentPhone || "—"}
              </p>
            </div>

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+255712345678"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use international format (e.g. +255…). A verification SMS is
                    sent to this number.
                  </FormDescription>
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
                    Saving…
                  </span>
                ) : (
                  "Change & re-send"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
