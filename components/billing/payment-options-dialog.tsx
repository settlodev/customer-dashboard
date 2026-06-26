"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Loader2, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/helpers";
import { useToast } from "@/hooks/use-toast";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";

import { initiatePayment } from "@/lib/actions/payment-actions";
import { refreshSubscriptionToken } from "@/lib/actions/destination";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";

import {
  SUPPORTED_TELCOS,
  TelcoLogo,
  type TelcoBrand,
} from "./telco-brands";

// ─────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────

const Schema = z.object({
  paymentMethodId: z
    .string({ required_error: "Pick a payment method" })
    .min(1, "Pick a payment method"),
  phone: z
    .string({ required_error: "Phone is required" })
    .refine(isValidPhoneNumber, { message: "Enter a valid phone number" }),
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Enter a valid email"),
});

type FormData = z.infer<typeof Schema>;

// ─────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────

export interface PaymentOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
  };
  businessId: string;
  /** Optional: not sent to the payment API (Billing derives routing from the
   *  invoice). Kept for callers that historically passed a location context. */
  locationId?: string;
  description?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  /** Fired once the payment lands in SUCCESS — caller refreshes invoice/list. */
  onPaid?: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export function PaymentOptionsDialog({
  open,
  onOpenChange,
  invoice,
  businessId,
  locationId,
  description,
  defaultEmail,
  defaultPhone,
  onPaid,
}: PaymentOptionsDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [paymentRefId, setPaymentRefId] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const { status: paymentStatus, error: paymentError } =
    usePaymentPolling(paymentRefId);

  // Polling is active from the moment we have a payment ref until we hit
  // a terminal status. Use this to keep the form's submit button locked
  // and the user oriented while the USSD push is awaiting confirmation.
  const waitingForConfirmation =
    !!paymentRefId &&
    paymentStatus !== "SUCCESS" &&
    paymentStatus !== "FAILED";

  // Keep latest callback refs so the success effect can depend only on the
  // polling status, not on prop identity. Without this, parent re-renders
  // (very common after success because the parent refetches the invoice)
  // refire the success effect, repeatedly cancelling and rescheduling the
  // 1500ms cleanup timer and triggering React's "max update depth" guard.
  const onPaidRef = useRef(onPaid);
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onPaidRef.current = onPaid;
    onOpenChangeRef.current = onOpenChange;
  });

  const form = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      paymentMethodId: "",
      phone: defaultPhone ?? "",
      email: defaultEmail ?? "",
    },
  });

  // ── Reset form when reopened ───────────────────────────────────────
  useEffect(() => {
    if (open) {
      form.reset({
        paymentMethodId: "",
        phone: defaultPhone ?? "",
        email: defaultEmail ?? "",
      });
      setPaymentRefId(null);
      setStatusOpen(false);
    }
  }, [open, defaultEmail, defaultPhone, form]);

  // ── Watch payment polling — fire onPaid + close on SUCCESS ─────────
  // Deps intentionally exclude `onPaid`, `onOpenChange`, and `toast` — they
  // come from props/hooks that can re-create their identities on every parent
  // render, which would refire this effect, cancel the success timer, and
  // loop. We read them through refs instead.
  useEffect(() => {
    if (paymentStatus === "SUCCESS") {
      toast({
        title: "Payment successful",
        description: `Invoice ${invoice.invoiceNumber} is paid.`,
      });
      const t = setTimeout(async () => {
        setStatusOpen(false);
        setPaymentRefId(null);
        // Re-mint the access token so its subscription_status claim catches up to the
        // just-activated subscription. The middleware gate reads that claim (not live
        // billing), so without this the user can stay pinned to /billing after paying
        // and the app does not "open" on its own (issue 4). Best-effort — onPaid's
        // refresh below still runs if this fails.
        try {
          await refreshSubscriptionToken();
        } catch {
          // non-fatal — next navigation refreshes the token reactively
        }
        onOpenChangeRef.current?.(false);
        onPaidRef.current?.();
      }, 1500);
      return () => clearTimeout(t);
    }
    if (paymentStatus === "FAILED") {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: paymentError || "Please try again.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus, paymentError, invoice.invoiceNumber]);


  const onSubmit = useCallback(
    async (data: FormData) => {
      setSubmitting(true);
      setStatusOpen(true);
      try {
        const payment = await initiatePayment({
          invoiceId: invoice.id,
          customerPhone: data.phone,
          customerEmail: data.email,
          channel: "MOBILE_MONEY",
        });
        setPaymentRefId(payment.externalReferenceId);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Couldn't start payment",
          description: err instanceof Error ? err.message : "Please try again.",
        });
        setStatusOpen(false);
      } finally {
        setSubmitting(false);
      }
    },
    [invoice, businessId, description, toast],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-lg"
          overlayClassName="bg-foreground/30 backdrop-blur-sm"
        >
          <DialogHeader>
            <DialogTitle>Pay invoice {invoice.invoiceNumber}</DialogTitle>
            <DialogDescription>
              {formatMoney(invoice.amount, invoice.currency)} due. Choose a
              mobile-money provider and confirm the push on your phone.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Payment method
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {SUPPORTED_TELCOS.map((brand) => (
                          <TelcoCard
                            key={brand.id}
                            brand={brand}
                            selected={field.value === brand.paymentMethodId}
                            disabled={submitting}
                            onSelect={() => field.onChange(brand.paymentMethodId)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        Phone for the push
                      </FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Phone number"
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        Email for the receipt
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting || waitingForConfirmation}
                  title={
                    waitingForConfirmation
                      ? "Payment is still being confirmed — keep this window open."
                      : undefined
                  }
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || waitingForConfirmation}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending push…
                    </>
                  ) : waitingForConfirmation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Awaiting confirmation on your phone…
                    </>
                  ) : (
                    <>Pay {formatMoney(invoice.amount, invoice.currency)}</>
                  )}
                </Button>
              </DialogFooter>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Secure payment processed by our payment provider.
              </p>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PaymentStatusModal
        isOpen={statusOpen}
        status={
          paymentStatus === "ACCEPTED"
            ? "PENDING"
            : paymentStatus === "PROCESSING"
              ? "PROCESSING"
              : paymentStatus === "SUCCESS"
                ? "SUCCESS"
                : paymentStatus === "FAILED"
                  ? "FAILED"
                  : "INITIATING"
        }
        onClose={() => {
          setStatusOpen(false);
          setPaymentRefId(null);
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Telco card — radio-style selectable tile with brand logo.
// ─────────────────────────────────────────────────────────────────────

function TelcoCard({
  brand,
  selected,
  disabled,
  onSelect,
}: {
  brand: TelcoBrand;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-xl border bg-card p-2.5 text-center transition-all",
        "hover:-translate-y-px hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40",
        selected ? "border-transparent shadow-sm" : "border-line",
        disabled && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none",
      )}
      style={selected ? { boxShadow: `0 0 0 2px ${brand.accent}` } : undefined}
    >
      <TelcoLogo brand={brand} />
      <span className="text-[11.5px] font-medium text-ink">{brand.label}</span>
    </button>
  );
}
