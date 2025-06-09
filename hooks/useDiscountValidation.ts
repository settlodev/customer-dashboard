import { useState, useEffect, useCallback } from 'react';
import { validateDiscountCode } from '@/lib/actions/subscriptions';
import { ValidDiscountCode } from '@/types/subscription/type';
import { useToast } from '@/hooks/use-toast';

export const useDiscountValidation = () => {
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountValid, setDiscountValid] = useState<boolean | null>(null);
  const [validatedDiscountCode, setValidatedDiscountCode] = useState<ValidDiscountCode | null>(null);
  const { toast } = useToast();

  const validateDiscount = useCallback(async (code: string) => {
    if (!code) {
      setDiscountValid(null);
      return;
    }

    setIsValidatingDiscount(true);
    try {
      const validateCode = await validateDiscountCode(code);
      setValidatedDiscountCode(validateCode);
      setDiscountValid(true);
      toast({
        title: "Discount Code Valid",
        description: "The discount code has been applied successfully",
        variant: "default"
      });
    } catch (error) {
      setDiscountValid(false);
      console.log("Error validating discount code:", error);
    } finally {
      setIsValidatingDiscount(false);
    }
  }, [toast]);

  return {
    isValidatingDiscount,
    discountValid,
    validatedDiscountCode,
    validateDiscount
  };
};