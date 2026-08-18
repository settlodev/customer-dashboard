"use client";

import { useCallback, useState } from "react";
import { validateCoupon } from "@/lib/actions/billing-actions";
import type { Coupon } from "@/types/billing/types";

interface UseCouponValidationReturn {
  isValidating: boolean;
  isValid: boolean;
  coupon: Coupon | null;
  validate: (code: string) => void;
  clear: () => void;
}

export function useCouponValidation(): UseCouponValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const validate = useCallback(async (code: string) => {
    if (!code.trim()) {
      setCoupon(null);
      setIsValid(false);
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateCoupon(code);
      if (result && result.isActive) {
        setCoupon(result);
        setIsValid(true);
      } else {
        setCoupon(null);
        setIsValid(false);
      }
    } catch {
      setCoupon(null);
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clear = useCallback(() => {
    setCoupon(null);
    setIsValid(false);
  }, []);

  return { isValidating, isValid, coupon, validate, clear };
}
