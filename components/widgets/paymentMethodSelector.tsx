"use client";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { acceptOrderPaymentMethods } from "@/lib/actions/settings-actions";

export interface PaymentMethodType {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
}

interface PaymentMethodGroup {
  name: string;
  description: string | null;
  acceptedPaymentMethodTypes: PaymentMethodType[];
}

interface PaymentMethodSelectorProps {
  mode: "bank" | "mno";
  placeholder?: string;
  value?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const GROUP_NAME: Record<"bank" | "mno", string> = {
  bank: "Bank",
  mno: "Mobile Money",
};

function PaymentMethodSelectorWidget({
  mode,
  placeholder,
  value,
  isDisabled,
  onChange,
  onBlur,
}: PaymentMethodSelectorProps) {
  const [options, setOptions] = useState<PaymentMethodType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      try {
        setIsLoading(true);
        const data: PaymentMethodGroup[] = await acceptOrderPaymentMethods();

        const targetGroup = GROUP_NAME[mode];
        const group = data?.find(
          (g) => g.name.toLowerCase() === targetGroup.toLowerCase(),
        );

        const specific =
          group?.acceptedPaymentMethodTypes.filter(
            (m) => !m.description?.toLowerCase().includes("generic"),
          ) ?? [];

        setOptions(specific);
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
              {item.name}
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
