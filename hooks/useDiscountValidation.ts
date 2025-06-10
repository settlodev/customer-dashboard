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
    if (!code || code.trim() === '') {
      setDiscountValid(null);
      setValidatedDiscountCode(null);
      return;
    }

    setIsValidatingDiscount(true);
    try {
      const validateCode = await validateDiscountCode(code);
      
      setValidatedDiscountCode(validateCode);
      setDiscountValid(true);
      
      // Show different messages based on discount type
      const discountType = validateCode?.discountType?.toLowerCase();
      const discountValue = validateCode?.discountValue;
      
      let description = "The discount code has been applied successfully";
      if (discountType === 'percentage') {
        description = `${discountValue}% discount has been applied`;
      } else if (discountType === 'fixed') {
        description = `TZS ${discountValue?.toLocaleString()} discount has been applied`;
      }
      
      toast({
        title: "Discount Code Valid",
        description,
        variant: "default"
      });
    } catch (error) {
      setDiscountValid(false);
      setValidatedDiscountCode(null);
      console.log("Error validating discount code:", error);
      
      toast({
        title: "Invalid Discount Code",
        description: "The discount code you entered is not valid or has expired",
        variant: "destructive"
      });
    } finally {
      setIsValidatingDiscount(false);
    }
  }, [toast]);

  const clearDiscount = useCallback(() => {
    setDiscountValid(null);
    setValidatedDiscountCode(null);
  }, []);

  return {
    isValidatingDiscount,
    discountValid,
    validatedDiscountCode,
    validateDiscount,
    clearDiscount
  };
};