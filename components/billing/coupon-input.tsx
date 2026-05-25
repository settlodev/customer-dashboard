"use client";

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateCoupon } from "@/lib/actions/billing-actions";
import { cn } from "@/lib/utils";
import type { Coupon } from "@/types/billing/types";

interface CouponInputProps {
  /** Notify the parent so it can pass the coupon to the next invoice generation. */
  onCouponChange: (coupon: Coupon | null) => void;
  disabled?: boolean;
}

/**
 * Imperative handle exposed by CouponInput so a parent submit handler can
 * make sure any typed-but-not-yet-applied code is validated before it
 * proceeds with the invoice generation.
 */
export type CouponInputHandle = {
  /**
   * Returns when the coupon state is settled:
   *   - { status: "ready", coupon: null }   → no code entered
   *   - { status: "ready", coupon: Coupon } → already applied or just applied
   *   - { status: "invalid", message }      → code is present but failed validation
   */
  resolve(): Promise<
    | { status: "ready"; coupon: Coupon | null }
    | { status: "invalid"; message: string }
  >;
};

export const CouponInput = forwardRef<CouponInputHandle, CouponInputProps>(
  function CouponInput({ onCouponChange, disabled }, ref) {
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const validate = useCallback(
    async (
      raw: string,
    ): Promise<
      | { status: "ready"; coupon: Coupon | null }
      | { status: "invalid"; message: string }
    > => {
      const trimmed = raw.trim();
      if (!trimmed) return { status: "ready", coupon: null };
      setChecking(true);
      setError(null);
      try {
        const result = await validateCoupon(trimmed);
        if (!result || !result.isActive) {
          const message = "That code isn't active. Check the spelling or try another.";
          setCoupon(null);
          onCouponChange(null);
          setError(message);
          return { status: "invalid", message };
        }
        if (result.validUntil && new Date(result.validUntil) < new Date()) {
          const message = "This coupon has expired.";
          setCoupon(null);
          onCouponChange(null);
          setError(message);
          return { status: "invalid", message };
        }
        setCoupon(result);
        onCouponChange(result);
        return { status: "ready", coupon: result };
      } catch {
        const message = "Couldn't reach the billing service. Try again.";
        setCoupon(null);
        onCouponChange(null);
        setError(message);
        return { status: "invalid", message };
      } finally {
        setChecking(false);
      }
    },
    [onCouponChange],
  );

  const apply = useCallback(async () => {
    await validate(code);
  }, [code, validate]);

  useImperativeHandle(
    ref,
    () => ({
      async resolve() {
        // Already applied — nothing pending.
        if (coupon) return { status: "ready", coupon };
        return validate(code);
      },
    }),
    [code, coupon, validate],
  );

  const clear = useCallback(() => {
    setCode("");
    setCoupon(null);
    setError(null);
    onCouponChange(null);
  }, [onCouponChange]);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-[11.5px] tracking-[0.01em] text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        Coupon code
      </label>
      <div className="flex items-center gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (coupon) {
              setCoupon(null);
              onCouponChange(null);
            }
            setError(null);
          }}
          placeholder="Enter code"
          disabled={disabled || !!coupon}
          className="h-9 font-mono text-[12.5px] uppercase tracking-[0.04em]"
        />
        {coupon ? (
          <Button type="button" variant="outline" size="sm" onClick={clear} disabled={disabled}>
            Remove
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={apply} disabled={disabled || checking || !code.trim()}>
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
          </Button>
        )}
      </div>

      {coupon && (
        <div className="flex items-start gap-2 rounded-md border border-pos/30 bg-pos-tint px-2.5 py-2">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-pos" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-pos">
              {coupon.code} applied
              <Badge variant="pos">
                {coupon.discountType === "PERCENTAGE"
                  ? `${coupon.discountValue}% off`
                  : `${coupon.discountValue.toLocaleString()} off`}
              </Badge>
            </p>
            {coupon.description && (
              <p className="text-[11.5px] text-pos/80">{coupon.description}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className={cn("flex items-center gap-1.5 text-[11.5px] text-neg")}>
          <XCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
});
