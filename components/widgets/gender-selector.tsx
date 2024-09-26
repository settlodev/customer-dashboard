import React from "react";
import { Gender } from "@/types/enums";
import {Select, SelectItem} from "@/components/ui/select";

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
    <Select>
      <SelectItem key={Gender.MALE} value={Gender.MALE}>
        Male
      </SelectItem>
      <SelectItem key={Gender.FEMALE} value={Gender.FEMALE}>
        Female
      </SelectItem>
      <SelectItem key={Gender.UNDISCLOSED} value={Gender.UNDISCLOSED}>
        Do not disclose
      </SelectItem>
    </Select>
  );
}
