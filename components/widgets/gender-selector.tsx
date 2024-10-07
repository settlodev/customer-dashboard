import React from "react";
import { Gender } from "@/types/enums";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

interface GenderSelectorProps {
  label: string;
  placeholder: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export default function GenderSelector({
  label,
  placeholder,
  isRequired,
  value,
  isDisabled,
  description,
  onChange,
  onBlur,
}: GenderSelectorProps) {
  return (
      <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select gender"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={Gender.MALE} value={Gender.MALE}>
                Male
              </SelectItem>
              <SelectItem key={Gender.FEMALE} value={Gender.FEMALE}>
                Female
              </SelectItem>
              <SelectItem key={Gender.UNDISCLOSED} value={Gender.UNDISCLOSED}>
                Do not disclose
              </SelectItem>
            </SelectContent>
      </Select>
  );
}
