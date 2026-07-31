"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertBody, AlertDescription, AlertIcon } from "@/components/ui/alert";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import {
  addSupplierPaymentAccount,
  updateSupplierPaymentAccount,
} from "@/lib/actions/admin/settlo-suppliers";
import {
  BANK_PROVIDERS,
  MOBILE_PROVIDERS,
  paymentAccountSchema,
  type PaymentAccountInput,
  type SupplierPaymentAccount,
} from "@/types/admin/settlo-suppliers";

/** "MWANGA_HAKIKA_BANK" → "Mwanga Hakika Bank". Shared with `payment-accounts-card.tsx`. */
export function providerLabel(provider: string | null | undefined): string {
  if (!provider) return "";
  return provider
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export const PAYMENT_METHOD_LABELS: Record<
  SupplierPaymentAccount["paymentMethod"],
  string
> = {
  BANK_TRANSFER: "Bank transfer",
  MOBILE_MONEY: "Mobile money",
  CASH: "Cash",
  CHEQUE: "Cheque",
};

interface PaymentAccountDialogProps {
  supplierId: string;
  account?: SupplierPaymentAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

function emptyValues(): PaymentAccountInput {
  return {
    paymentMethod: "MOBILE_MONEY",
    provider: undefined,
    accountName: "",
    accountNumber: "",
    bankName: "",
    mobileProvider: "",
    mobileNumber: "",
  };
}

function valuesFromAccount(a: SupplierPaymentAccount): PaymentAccountInput {
  return {
    paymentMethod: a.paymentMethod,
    provider: a.provider ?? undefined,
    accountName: a.accountName ?? "",
    accountNumber: a.accountNumber ?? "",
    bankName: a.bankName ?? "",
    mobileProvider: a.mobileProvider ?? "",
    mobileNumber: a.mobileNumber ?? "",
  };
}

/**
 * PaymentAccountDialog — create/edit form for a supplier's payment
 * accounts. `paymentMethod` drives which fields apply (mirrors the
 * backend's `DisbursementProviders` validation in `paymentAccountSchema`):
 *   - MOBILE_MONEY: provider (MOBILE_PROVIDERS) + mobile number
 *   - BANK_TRANSFER: provider (BANK_PROVIDERS) + account number + bank name
 *   - CASH / CHEQUE: no provider — flagged as not usable for disbursement
 * Account name is always collected.
 */
export function PaymentAccountDialog({
  supplierId,
  account,
  open,
  onOpenChange,
  onSaved,
}: PaymentAccountDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  const isEdit = !!account;

  const form = useForm<PaymentAccountInput>({
    resolver: zodResolver(paymentAccountSchema),
    defaultValues: account ? valuesFromAccount(account) : emptyValues(),
  });

  useEffect(() => {
    if (!open) {
      form.reset(emptyValues());
      setError("");
      return;
    }
    form.reset(account ? valuesFromAccount(account) : emptyValues());
  }, [open, account, form]);

  const paymentMethod = form.watch("paymentMethod");
  const isMobile = paymentMethod === "MOBILE_MONEY";
  const isBank = paymentMethod === "BANK_TRANSFER";
  const isCashOrCheque = paymentMethod === "CASH" || paymentMethod === "CHEQUE";

  const onSubmit = (values: PaymentAccountInput) => {
    setError("");
    startTransition(async () => {
      const result = isEdit
        ? await updateSupplierPaymentAccount(account.id, values)
        : await addSupplierPaymentAccount(supplierId, values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      onSaved();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit payment account" : "Add payment account"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this disbursement rail's details."
              : "Add a disbursement rail this supplier can be paid on."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && (
          <Alert tone="warning">
            <AlertIcon>
              <Info className="h-3.5 w-3.5" />
            </AlertIcon>
            <AlertBody>
              <AlertDescription>
                Changing payment details will un-verify this account and
                clear its default flag.
              </AlertDescription>
            </AlertBody>
          </Alert>
        )}

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
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("provider", undefined);
                      // Clear the rail fields that no longer apply so the
                      // form doesn't silently carry over a stale identifier
                      // from the previous method (mirrors the scrub in
                      // `paymentAccountFields` server-side).
                      if (value === "BANK_TRANSFER") {
                        form.setValue("mobileNumber", "");
                      } else if (value === "MOBILE_MONEY") {
                        form.setValue("accountNumber", "");
                        form.setValue("bankName", "");
                      } else {
                        form.setValue("accountNumber", "");
                        form.setValue("bankName", "");
                        form.setValue("mobileNumber", "");
                      }
                    }}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        Object.keys(PAYMENT_METHOD_LABELS) as Array<
                          SupplierPaymentAccount["paymentMethod"]
                        >
                      ).map((method) => (
                        <SelectItem key={method} value={method}>
                          {PAYMENT_METHOD_LABELS[method]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isMobile && (
              <>
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile money provider</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOBILE_PROVIDERS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {providerLabel(p)}
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
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+255 700 000 000"
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {isBank && (
              <>
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a bank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BANK_PROVIDERS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {providerLabel(p)}
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
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account number</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Branch or display name (optional)"
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {isCashOrCheque && (
              <Alert tone="info">
                <AlertIcon>
                  <Info className="h-3.5 w-3.5" />
                </AlertIcon>
                <AlertBody>
                  <AlertDescription>
                    Not usable for loan disbursement.
                  </AlertDescription>
                </AlertBody>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Payee name on the account"
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
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
                    Saving…
                  </span>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Add account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
