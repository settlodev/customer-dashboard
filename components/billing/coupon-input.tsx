"use client";

import React, { useCallback, useState } from "react";
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

export function CouponInput({ onCouponChange, disabled }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const apply = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setChecking(true);
    setError(null);
    try {
      const result = await validateCoupon(trimmed);
      if (!result || !result.isActive) {
        setCoupon(null);
        onCouponChange(null);
        setError("That code isn't active. Check the spelling or try another.");
        return;
      }
      if (result.validUntil && new Date(result.validUntil) < new Date()) {
        setCoupon(null);
        onCouponChange(null);
        setError("This coupon has expired.");
        return;
      }
      setCoupon(result);
      onCouponChange(result);
    } catch {
      setCoupon(null);
      onCouponChange(null);
      setError("Couldn't reach the billing service. Try again.");
    } finally {
      setChecking(false);
    }
  }, [code, onCouponChange]);

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
}
