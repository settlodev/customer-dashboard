"use client";
import { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
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
    <Combobox
      options={options.map((item) => ({
        value: item.id,
        label: item.displayName,
      }))}
      value={value ?? null}
      onChange={(v) => onChange(v ?? "")}
      placeholder={defaultPlaceholder}
      searchPlaceholder={mode === "bank" ? "Search banks…" : "Search MNOs…"}
      emptyText={
        isLoading
          ? "Loading…"
          : `No ${mode === "bank" ? "banks" : "MNOs"} available`
      }
      disabled={isDisabled || isLoading}
      ariaLabel={mode === "bank" ? "Bank" : "MNO"}
    />
  );
}

export default PaymentMethodSelectorWidget;
