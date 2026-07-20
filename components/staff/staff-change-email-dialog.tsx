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

import { changeStaffEmail } from "@/lib/actions/staff-actions";
import { ChangeStaffEmailSchema } from "@/types/staff";

type FormValues = z.infer<typeof ChangeStaffEmailSchema>;

interface StaffChangeEmailDialogProps {
  staffId: string;
  fullName: string;
  currentEmail: string | null | undefined;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/**
 * Change the address a dashboard-staff member signs in with.
 *
 * This is their Settlo login, not a contact field — so the copy leads with the
 * consequence (they're signed out and must use the new address) rather than
 * treating it like an ordinary profile edit.
 */
export function StaffChangeEmailDialog({
  staffId,
  fullName,
  currentEmail,
  open,
  onOpenChange,
}: StaffChangeEmailDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(ChangeStaffEmailSchema),
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
      const res = await changeStaffEmail(staffId, values.email.trim());
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      toast({
        variant: "success",
        title: "Login email updated",
        description: `${fullName} now signs in with ${values.email.trim()}.`,
      });
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Change login email</DialogTitle>
          <DialogDescription>
            This is the address {fullName} signs in to the dashboard with. They
            will be signed out everywhere and must use the new address next
            time. Their POS PIN is unaffected.
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
                {currentEmail || "—"}
              </p>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New login email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="staff@example.com"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    We&apos;ll notify both the old and the new address.
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
                  "Change email"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
