"use client";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchLocationPaymentMethods } from "@/lib/actions/payment-method-actions";
import { PaymentMethod, PaymentMethodChild } from "@/types/payments/type";

interface PaymentMethodSelectorProps {
  mode: "bank" | "mno";
  placeholder?: string;
  value?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const PARENT_CODE: Record<"bank" | "mno", string> = {
  bank: "BANK",
  mno: "MOBILE_MONEY",
};

function PaymentMethodSelectorWidget({
  mode,
  placeholder,
  value,
  isDisabled,
  onChange,
  onBlur,
}: PaymentMethodSelectorProps) {
  const [options, setOptions] = useState<PaymentMethodChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      try {
        setIsLoading(true);
        const data: PaymentMethod[] = await fetchLocationPaymentMethods();

        const targetCode = PARENT_CODE[mode];
        const parent = data?.find((m) => m.code === targetCode);
        setOptions(parent?.children ?? []);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOptions();
  }, [mode]);

  const defaultPlaceholder =
    placeholder ?? (mode === "bank" ? "Select a bank" : "Select an MNO");

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={isDisabled || isLoading}
    >
      <SelectTrigger onBlur={onBlur}>
        <SelectValue
          placeholder={isLoading ? "Loading…" : defaultPlaceholder}
        />
      </SelectTrigger>
      <SelectContent>
        {options.length > 0 ? (
          options.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.displayName}
            </SelectItem>
          ))
        ) : (
          <div className="p-2 text-sm text-gray-500">
            {isLoading
              ? "Loading…"
              : `No ${mode === "bank" ? "banks" : "MNOs"} available`}
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

export default PaymentMethodSelectorWidget;
