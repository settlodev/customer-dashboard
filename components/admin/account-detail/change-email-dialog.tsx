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

import { changeAccountEmail } from "@/lib/actions/admin/accounts";
import { ChangeEmailSchema } from "@/types/admin/schemas";

type FormValues = z.infer<typeof ChangeEmailSchema>;

interface ChangeEmailDialogProps {
  accountId: string;
  currentEmail: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ChangeEmailDialog({
  accountId,
  currentEmail,
  open,
  onOpenChange,
}: ChangeEmailDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ email: "" });
      setError("");
    }
  }, [open, form]);

  const onSubmit = (values: FormValues) => {
    setError("");
    startTransition(async () => {
      const res = await changeAccountEmail(accountId, values.email.trim());
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      toast({ title: "Email updated", description: res.message });
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Change email</DialogTitle>
          <DialogDescription>
            Fix a typo in this <strong>unverified</strong> account&apos;s email
            and re-send verification. The new address must be confirmed before
            the owner can sign in. Already-verified accounts can&apos;t be
            changed here — the owner updates it from their own dashboard.
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
              <p className="font-mono text-[13px] text-ink">{currentEmail}</p>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="owner@example.com"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A verification email is sent to this address.
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
