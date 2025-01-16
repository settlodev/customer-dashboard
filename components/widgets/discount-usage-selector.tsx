import React from "react";
import { discountUsage} from "@/types/enums";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

interface DiscountUsageSelectorProps {
  label: string;
  placeholder: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export default function DiscountUsageSelector({
  placeholder,
  value,
  isDisabled,
  onChange,
}: DiscountUsageSelectorProps) {
  return (
      <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select discount usage once or repeated"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={discountUsage.ONCE} value={discountUsage.ONCE}>
                Once
              </SelectItem>
              <SelectItem key={discountUsage.REPEATED} value={discountUsage.REPEATED}>
                Repeated
              </SelectItem>
            </SelectContent>
      </Select>
  );
}
